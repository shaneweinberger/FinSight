"""
Transformers for cleaning, categorizing, and standardizing transaction data.
"""
import pandas as pd
import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)

class TransactionTransformer:
    """Handles transformation logic including AI categorization."""
    
    def __init__(self, categories_file: Path, rule_service=None):
        self.categories_file = categories_file
        self.rule_service = rule_service
        self.categories = self._load_categories()
        
    def _load_categories(self) -> List[str]:
        if not self.categories_file.exists():
            return []
        with open(self.categories_file, 'r') as f:
            data = json.load(f)
            return data.get('categories', [])

    def transform(self, df: pd.DataFrame, transaction_type: str = 'both') -> pd.DataFrame:
        """Apply all transformations to the DataFrame."""
        df = df.copy()
        
        # 1. Clean Amounts
        df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce')
        df = df.dropna(subset=['Amount'])
        
        # 2. Clean Descriptions
        df['Description'] = df['Description'].astype(str).str.strip()
        
        # 3. Filter out payments/transfers if needed (optional, based on config)
        # For now, we keep everything but maybe flag them?
        
        # 4. Categorize
        df = self._categorize_transactions(df, transaction_type)
        
        # 5. Filter out transactions marked for deletion
        df = df[df['Category'] != 'DELETE']
        
        return df

    def _categorize_transactions(self, df: pd.DataFrame, transaction_type: str) -> pd.DataFrame:
        """Categorize transactions using Gemini API with optional User Rules."""
        if not api_key:
            print("Warning: GEMINI_API_KEY not found. Skipping AI categorization.")
            df['Category'] = 'Uncategorized'
            return df
            
        # Get user rules if available
        user_rules_text = ""
        if self.rule_service:
            rules = self.rule_service.get_rules()
            # Filter rules by type
            # 'credit' matches 'credit' and 'both'
            # 'debit' matches 'debit' and 'both'
            applicable_rules = [
                r for r in rules 
                if r.rule_type == 'both' or r.rule_type == transaction_type
            ]
            
            if applicable_rules:
                rules_list = "\n".join([f"- {r.content}" for r in applicable_rules])
                user_rules_text = f"""
                
                USER DEFINED RULES (PRIORITY - THESE OVERRIDE EVERYTHING ELSE):
                {rules_list}
                
                IF A RULE MATCHES, APPLY IT. 
                - YOU CAN ALSO RENAME THE DESCRIPTION BASED ON THE RULE using "RenamedDescription".
                - PAY ATTENTION TO AMOUNTS AND DATES IF THE RULE SPECIFIES THEM.
                - IF THE RULE IMPLIES THE TRANSACTION SHOULD BE DELETED (e.g. "delete under $1"), ASSIGN THE CATEGORY "DELETE".
                """
            
        # Create a temporary ID for mapping back results if not present
        # actually we can just iterate over the dataframe rows
        # But we need to update the dataframe.
        # Let's add a temporary '_temp_id' column
        df['_temp_id'] = range(len(df))
        
        # Prepare transaction objects
        # To save tokens, we can check if rules exist. 
        # If NO rules exist, we can fallback to the cheaper unique description method?
        # User wants rules content to apply. So we must use full context if rules are present.
        # But to be safe and consistent, let's just use full context always or maybe grouping?
        
        # Optimization: Group by (Description, Amount, Date) to reduce duplicates
        # But "Date" might be irrelevant for some rules, "Amount" for others.
        # Safest is to pass every transaction that is distinct.
        # Let's Group by (Description, Amount) as a middle ground? 
        # Actually, "First $1020 payment of each month" implies Date matters.
        # So we really need to pass (Description, Amount, Date).
        
        # Let's convert to dict records
        records = df[['_temp_id', 'Transaction Date', 'Description', 'Amount']].to_dict('records')
        
        # Batch process
        batch_size = 30 # Reduced batch size as payloads are larger
        
        # We need to map _temp_id -> Category, RenamedDescription
        id_to_category = {}
        id_to_new_desc = {}
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i+batch_size]
            print(f"Categorizing batch {i//batch_size + 1} of {len(records)//batch_size + 1}...")
            
            # Minimize payload by only sending necessary fields
            # We send _temp_id so Gemini can tell us which one is which, 
            # BUT we don't need to ask Gemini to repeat the ID back if we maintain order?
            # No, LLMs are not guaranteed to preserve order perfectly or return same count.
            # Best to ask it to return `id` (which is our _temp_id).
            
            prompt_batch = []
            for r in batch:
                prompt_batch.append({
                    "id": r['_temp_id'],
                    "Date": r['Transaction Date'],
                    "Description": r['Description'],
                    "Amount": r['Amount']
                })
            
            prompt = f"""
            As a professional financial accountant you are given a list of financial transactions.
            
            Your job is to assign each transaction to one of the following categories:
            {", ".join(self.categories)}
            
            IMPORTANT INSTRUCTIONS:
            1. You MUST use one of the categories listed above.
            2. If a transaction description contains words that clearly match a category name (e.g. "E-TRANSFER" -> "E-Transfer"), you MUST use that category.
            3. Only use "Uncategorized" if you are absolutely unsure.
            {user_rules_text}
            
            Return your answer as a JSON array of objects. Each object MUST contain:
            - "id": The exact id provided in the input.
            - "Category": The assigned category.
            - "RenamedDescription": (Optional) New description if a rule says to rename it.
            
            Here are the Transactions:
            {json.dumps(prompt_batch, indent=0)}
            """
            
            try:
                model = genai.GenerativeModel('gemini-2.5-flash')
                # Lower temperature for determinism, but Flash is usually fast
                response = model.generate_content(prompt, generation_config={"temperature": 0.1})
                
                # Check for Valid JSON
                match = re.search(r'\[\s*{.*?}\s*\]', response.text, re.DOTALL)
                if match:
                    output_json = json.loads(match.group(0))
                    for item in output_json:
                        t_id = item.get('id')
                        if t_id is not None:
                            id_to_category[t_id] = item.get('Category', 'Uncategorized')
                            if item.get('RenamedDescription'):
                                id_to_new_desc[t_id] = item.get('RenamedDescription')
                else:
                    print("Warning: No JSON found in Gemini response")
                    print(f"Response text preview: {response.text[:200]}...")
                    
            except Exception as e:
                print(f"Error calling Gemini: {e}")
        
        # Apply results back to DF
        df['Category'] = df['_temp_id'].map(id_to_category).fillna('Uncategorized')
        
        # Apply renaming
        if id_to_new_desc:
            new_desc_series = df['_temp_id'].map(id_to_new_desc)
            df['Description'] = new_desc_series.combine_first(df['Description'])
            
        # Drop temp column
        df = df.drop(columns=['_temp_id'])
        
        return df
