import os
import re
import pandas as pd
import json
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    raise ValueError("API key not found in .env file under 'GEMINI_API_KEY'.")
genai.configure(api_key=api_key)

# Set paths
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), '../debit_uploads')
GOLD_DIR = os.path.join(os.path.dirname(__file__), '../gold')
CATEGORIES_FILE = os.path.join(GOLD_DIR, 'categories.json')

def preview_df(df, n=100, filename="preview.csv"):
    """
    Save the first `n` rows of the DataFrame to a CSV file and open it.
    Only works on macOS with the default `open` command.
    """
    df.head(n).to_csv(filename, index=False)
    os.system(f"open {filename}")

# Find all CSV files in uploads
csv_files = [f for f in os.listdir(UPLOADS_DIR) if f.endswith('.csv')]
if not csv_files:
    raise FileNotFoundError('No CSV files found in debit_uploads directory.')

# Get the most recently uploaded CSV file
latest_file = max(
    [os.path.join(UPLOADS_DIR, f) for f in csv_files],
    key=os.path.getctime
)

# Load data
print(f"Reading: {latest_file}")

# Check if this is a TD debit file (no headers, 5 columns)
df = pd.read_csv(latest_file, header=None)
if len(df.columns) == 5:
    # TD debit format: Transaction Date, Description, Outflow, Inflow, Balance
    df.columns = ['Transaction Date', 'Description', 'Outflow', 'Inflow', 'Balance']
    
    # Process outflows (column 3) and inflows (column 4)
    df['Outflow'] = pd.to_numeric(df['Outflow'], errors='coerce').fillna(0)
    df['Inflow'] = pd.to_numeric(df['Inflow'], errors='coerce').fillna(0)
    
    # Create Amount column: outflows are positive, inflows are negative
    df['Amount'] = df['Outflow'] - df['Inflow']
    
    # Remove the outflow, inflow, and balance columns
    df = df.drop(['Outflow', 'Inflow', 'Balance'], axis=1)
    
    # Convert date format from YYYY-MM-DD to MM/DD/YYYY to match credit format
    df['Transaction Date'] = pd.to_datetime(df['Transaction Date']).dt.strftime('%m/%d/%Y')
    
    # Add a Category column (will be empty for now)
    df['Category'] = ''
    
    # Filter out TD VISA transactions
    print(f"Before filtering TD VISA transactions: {len(df)} transactions")
    df = df[~df['Description'].str.startswith('TD VISA', na=False)]
    print(f"After filtering TD VISA transactions: {len(df)} transactions")
else:
    # Assume it's a regular CSV with headers
    df = pd.read_csv(latest_file)
    # Handle different column naming conventions
    if 'Details' in df.columns:
        df = df.rename(columns={"Details": "Transaction Date", "Posting Date": "Description", "Description": "Amount", "Amount": "Type", "Type": "Balance"})
        df = df[['Transaction Date', 'Description', 'Amount', 'Type']]
        df = df[df['Type'] != 'LOAN_PMT']
        df['Category'] = ''
    else:
        # If it already has the right columns, just add Category if missing
        if 'Category' not in df.columns:
            df['Category'] = ''


# Load existing categories for Gemini
with open(CATEGORIES_FILE, 'r') as f:
    categories_json = json.load(f)
categories = categories_json['categories']

# Create a better prompt for Gemini
prompt = f"""
As a professional financial accountant you are given a list of financial transactions. Each has a 'Description' (what the transaction was) and an 'Amount'.

Your job is to assign each Description to one of the following categories:
{", ".join(categories)}

IMPORTANT INSTRUCTIONS:
1. You MUST use one of the categories listed above.
2. If a transaction description contains words that clearly match a category name (e.g. "E-TRANSFER" -> "E-Transfer"), you MUST use that category.
3. Only use "Uncategorized" if you are absolutely unsure.

Return your answer as a JSON array. Each object should look like:
{{"Description": "...", "Category": "..."}}

Here are the Descriptions:
{df['Description'].tolist()}
"""

# Send to Gemini
print("Sending to Gemini for categorization...")
model = genai.GenerativeModel('gemini-2.5-flash')
response = model.generate_content(prompt, generation_config={"temperature": 0.2})

# Debug
print("RAW GEMINI RESPONSE:\n", response.text)

# Extract JSON
match = re.search(r'\[\s*{.*?}\s*\]', response.text, re.DOTALL)
if not match:
    # Fallback if JSON not found
    print("Warning: Gemini response did not contain valid JSON array. Setting all to Uncategorized.")
    df['Category'] = 'Uncategorized'
else:
    try:
        output_json = json.loads(match.group(0))
        
        # Create a unique identifier for each transaction before merging
        df['Transaction_ID'] = range(len(df))
        
        # Merge with df
        output_df = pd.DataFrame(output_json)
        df['Description'] = df['Description'].astype(str)
        output_df['Description'] = output_df['Description'].astype(str)
        
        # Create a mapping from description to category (taking the first occurrence)
        description_to_category = output_df.set_index('Description')['Category'].to_dict()
        
        # Apply the mapping to get categories
        df['Category'] = df['Description'].map(description_to_category).fillna('Uncategorized')
        
        # Remove the temporary ID column
        df = df.drop('Transaction_ID', axis=1)
        
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        df['Category'] = 'Uncategorized'

# Reorder
df = df[['Transaction Date', 'Description', 'Category', 'Amount']]

# Filter out transactions with empty/missing amounts
print(f"Before filtering empty amounts: {len(df)} transactions")
df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce')
df = df.dropna(subset=['Amount'])
print(f"After filtering empty amounts: {len(df)} transactions")

# Filter out payment transactions
df = df[~df['Description'].str.contains('PAYMENT', case=False, na=False)]
print(f"After filtering payment transactions: {len(df)} transactions")

print(df.head())

# Merge with existing transactions
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from utils.merge_utils import merge_transactions

output_path = os.path.join(GOLD_DIR, 'debit_cleaned.csv')
existing_path = Path(output_path)

merged_df, new_count, duplicate_count = merge_transactions(
    df,
    existing_path,
    transaction_type='debit'
)

# Save the merged DataFrame to the gold directory
merged_df.to_csv(output_path, index=False)
print(f"Merged CSV saved to: {output_path}")
print(f"Summary: {new_count} new transactions added, {duplicate_count} duplicates skipped")
print(f"Total transactions: {len(merged_df)}")