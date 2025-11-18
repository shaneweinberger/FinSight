import os
import re
import pandas as pd
import json
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    raise ValueError("API key not found in .env file under 'GEMINI_API_KEY'.")
genai.configure(api_key=api_key)

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), '../credit_uploads')
GOLD_DIR = os.path.join(os.path.dirname(__file__), '../gold')
CATEGORIES_FILE = os.path.join(GOLD_DIR, 'categories.json')
COLUMNS_TO_KEEP = ['Transaction Date', 'Description', 'Amount']

# Find all CSV files in uploads
csv_files = [f for f in os.listdir(UPLOADS_DIR) if f.endswith('.csv')]
if not csv_files:
    raise FileNotFoundError('No CSV files found in uploads directory.')

# Get the most recently uploaded CSV file
latest_file = max(
    [os.path.join(UPLOADS_DIR, f) for f in csv_files],
    key=os.path.getctime
)

# Read the CSV file
print(f"Reading: {latest_file}")

# Check if this is a TD credit file (no headers, 5 columns)
df = pd.read_csv(latest_file, header=None)
if len(df.columns) == 5:
    # TD credit format: Transaction Date, Description, Outflow, Inflow, Balance
    df.columns = ['Transaction Date', 'Description', 'Outflow', 'Inflow', 'Balance']
    
    # Process outflows (column 3) and inflows (column 4)
    df['Outflow'] = pd.to_numeric(df['Outflow'], errors='coerce').fillna(0)
    df['Inflow'] = pd.to_numeric(df['Inflow'], errors='coerce').fillna(0)
    
    # Create Amount column: outflows are positive, inflows are negative
    df['Amount'] = df['Outflow'] - df['Inflow']
    
    # Remove the outflow, inflow, and balance columns
    df = df.drop(['Outflow', 'Inflow', 'Balance'], axis=1)
    
    # Add a Category column (will be empty for now)
    df['Category'] = ''
else:
    # Assume it's a regular CSV with headers
    df = pd.read_csv(latest_file)

# Remove rows where Type is 'payment' if the column exists
if 'Type' in df.columns:
    df = df[df['Type'].str.lower() != 'payment']

# Keep only the specified columns plus Category
columns_to_keep_with_category = COLUMNS_TO_KEEP + ['Category']
missing_cols = [col for col in columns_to_keep_with_category if col not in df.columns]
if missing_cols:
    raise ValueError(f"Missing columns in CSV: {missing_cols}")
cleaned_df = df[columns_to_keep_with_category].copy()

# Filter out transactions with empty/missing amounts
print(f"Before filtering empty amounts: {len(cleaned_df)} transactions")
cleaned_df['Amount'] = pd.to_numeric(cleaned_df['Amount'], errors='coerce')
cleaned_df = cleaned_df.dropna(subset=['Amount'])
print(f"After filtering empty amounts: {len(cleaned_df)} transactions")

# Filter out payment transactions (typically have empty amounts or are balance adjustments)
# These are usually account payments, not actual spending transactions
cleaned_df = cleaned_df[~cleaned_df['Description'].str.contains('PAYMENT', case=False, na=False)]
print(f"After filtering payment transactions: {len(cleaned_df)} transactions")

# Load existing categories for Gemini
with open(CATEGORIES_FILE, 'r') as f:
    categories_json = json.load(f)
categories = categories_json['categories']

# Create a better prompt for Gemini
prompt = f"""
As a professional financial accountant you are given a list of financial transactions. Each has a 'Description' (what the transaction was) and an 'Amount'.

Your job is to assign each Description to one of the following categories:
{", ".join(categories)}

If you are not confident which category applies, respond with "Uncategorized".

Return your answer as a JSON array. Each object should look like:
{{"Description": "...", "Category": "..."}}

Here are the Descriptions:
{cleaned_df['Description'].tolist()}
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
    raise ValueError("Gemini response did not contain valid JSON array.")
output_json = json.loads(match.group(0))

# Create a unique identifier for each transaction before merging
cleaned_df['Transaction_ID'] = range(len(cleaned_df))

# Merge with cleaned_df
output_df = pd.DataFrame(output_json)
cleaned_df['Description'] = cleaned_df['Description'].astype(str)
output_df['Description'] = output_df['Description'].astype(str)

# Create a mapping from description to category (taking the first occurrence)
description_to_category = output_df.set_index('Description')['Category'].to_dict()

# Apply the mapping to get categories
cleaned_df['Category'] = cleaned_df['Description'].map(description_to_category).fillna('Uncategorized')

# Remove the temporary ID column
cleaned_df = cleaned_df.drop('Transaction_ID', axis=1)

# Reorder columns
cleaned_df = cleaned_df[['Transaction Date', 'Description', 'Category', 'Amount']]

# Track all possible categories
new_categories = set(cleaned_df['Category'].dropna().unique())

# Load existing categories
if os.path.exists(CATEGORIES_FILE):
    with open(CATEGORIES_FILE, 'r') as f:
        categories_data = json.load(f)
    existing_categories = set(categories_data['categories'])
else:
    categories_data = {
        "categories": [],
        "metadata": {
            "last_updated": "",
            "total_categories": 0,
            "source": "credit_transactions"
        }
    }
    existing_categories = set()

# Merge categories
all_categories = existing_categories.union(new_categories)

# Update categories data
categories_data['categories'] = sorted(list(all_categories))
categories_data['metadata']['last_updated'] = datetime.now().strftime('%Y-%m-%d')
categories_data['metadata']['total_categories'] = len(all_categories)

# Save updated categories
with open(CATEGORIES_FILE, 'w') as f:
    json.dump(categories_data, f, indent=2)

print(f"Updated categories: {len(new_categories)} new categories found")

# Merge with existing transactions
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from utils.merge_utils import merge_transactions

output_path = os.path.join(GOLD_DIR, 'credit_cleaned.csv')
existing_path = Path(output_path)

merged_df, new_count, duplicate_count = merge_transactions(
    cleaned_df,
    existing_path,
    transaction_type='credit'
)

# Save the merged DataFrame to the gold folder
merged_df.to_csv(output_path, index=False)
print(f"Merged CSV saved to: {output_path}")
print(f"Summary: {new_count} new transactions added, {duplicate_count} duplicates skipped")
print(f"Total transactions: {len(merged_df)}")
