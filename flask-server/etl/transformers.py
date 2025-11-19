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
    
    def __init__(self, categories_file: Path):
        self.categories_file = categories_file
        self.categories = self._load_categories()
        
    def _load_categories(self) -> List[str]:
        if not self.categories_file.exists():
            return []
        with open(self.categories_file, 'r') as f:
            data = json.load(f)
            return data.get('categories', [])

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
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
        df = self._categorize_transactions(df)
        
        return df

    def _categorize_transactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """Categorize transactions using Gemini API."""
        if not api_key:
            print("Warning: GEMINI_API_KEY not found. Skipping AI categorization.")
            df['Category'] = 'Uncategorized'
            return df
            
        # Prepare prompt
        descriptions = df['Description'].unique().tolist()
        
        # Batch process if too many (limit to 50 for now per batch to be safe)
        batch_size = 50
        description_to_category = {}
        
        for i in range(0, len(descriptions), batch_size):
            batch = descriptions[i:i+batch_size]
            print(f"Categorizing batch {i//batch_size + 1} of {len(descriptions)//batch_size + 1}...")
            
            prompt = f"""
            As a professional financial accountant you are given a list of financial transactions.
            
            Your job is to assign each Description to one of the following categories:
            {", ".join(self.categories)}
            
            IMPORTANT INSTRUCTIONS:
            1. You MUST use one of the categories listed above.
            2. If a transaction description contains words that clearly match a category name (e.g. "E-TRANSFER" -> "E-Transfer"), you MUST use that category.
            3. Only use "Uncategorized" if you are absolutely unsure.
            
            Return your answer as a JSON array. Each object should look like:
            {{"Description": "...", "Category": "..."}}
            
            Here are the Descriptions:
            {batch}
            """
            
            try:
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(prompt, generation_config={"temperature": 0.1})
                
                match = re.search(r'\[\s*{.*?}\s*\]', response.text, re.DOTALL)
                if match:
                    output_json = json.loads(match.group(0))
                    for item in output_json:
                        description_to_category[item['Description']] = item['Category']
                else:
                    print("Warning: No JSON found in Gemini response")
                    
            except Exception as e:
                print(f"Error calling Gemini: {e}")
        
        # Apply mappings
        df['Category'] = df['Description'].map(description_to_category).fillna('Uncategorized')
        
        return df
