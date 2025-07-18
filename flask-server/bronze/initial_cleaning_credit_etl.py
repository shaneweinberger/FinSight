import os
import pandas as pd

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), '../credit_uploads')
GOLD_DIR = os.path.join(os.path.dirname(__file__), '../gold')
CATEGORIES_FILE = os.path.join(GOLD_DIR, 'all_categories.txt')
COLUMNS_TO_KEEP = ['Transaction Date', 'Description', 'Category', 'Amount']

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
df = pd.read_csv(latest_file)

# Remove rows where Type is 'payment' if the column exists
if 'Type' in df.columns:
    df = df[df['Type'].str.lower() != 'payment']

# Keep only the specified columns
missing_cols = [col for col in COLUMNS_TO_KEEP if col not in df.columns]
if missing_cols:
    raise ValueError(f"Missing columns in CSV: {missing_cols}")
cleaned_df = df[COLUMNS_TO_KEEP]

# Track all possible categories
categories = set(cleaned_df['Category'].dropna().unique())
if os.path.exists(CATEGORIES_FILE):
    with open(CATEGORIES_FILE, 'r') as f:
        existing = set(line.strip() for line in f if line.strip())
else:
    existing = set()
all_categories = existing.union(categories)
with open(CATEGORIES_FILE, 'w') as f:
    for cat in sorted(all_categories):
        f.write(f"{cat}\n")

# Save the cleaned DataFrame to the gold folder
output_path = os.path.join(GOLD_DIR, 'cleaned_transactions.csv')
cleaned_df.to_csv(output_path, index=False)
print(f"Cleaned CSV saved to: {output_path}")
