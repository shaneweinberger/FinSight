"""
Utility functions for merging transactions from multiple CSV uploads.
"""
import pandas as pd
from pathlib import Path
from typing import Tuple
import uuid


def merge_transactions(
    new_df: pd.DataFrame,
    existing_file_path: Path,
    transaction_type: str = 'credit'
) -> Tuple[pd.DataFrame, int, int]:
    """
    Merge new transactions with existing transactions, handling duplicates.
    
    Args:
        new_df: DataFrame with new transactions to merge
        existing_file_path: Path to existing gold file
        transaction_type: 'credit' or 'debit' for logging
        
    Returns:
        Tuple of (merged_df, new_count, duplicate_count)
    """
    # Ensure new_df has Transaction ID column
    if 'Transaction ID' not in new_df.columns:
        new_df['Transaction ID'] = None
    
    # Load existing transactions if file exists
    if existing_file_path.exists() and existing_file_path.stat().st_size > 0:
        existing_df = pd.read_csv(existing_file_path)
        
        # Ensure existing has Transaction ID column
        if 'Transaction ID' not in existing_df.columns:
            existing_df['Transaction ID'] = None
        
        print(f"Loaded {len(existing_df)} existing {transaction_type} transactions")
        
        # Find new transactions (not duplicates)
        new_transactions = []
        duplicate_count = 0
        
        for new_idx, new_row in new_df.iterrows():
            # Check if this transaction already exists
            # Match on: Transaction Date, Description, and Amount
            mask = (
                (existing_df['Transaction Date'] == new_row['Transaction Date']) &
                (existing_df['Description'] == str(new_row['Description'])) &
                (existing_df['Amount'] == new_row['Amount'])
            )
            matches = existing_df[mask]
            
            if len(matches) > 0:
                # Duplicate found - skip this transaction
                duplicate_count += 1
                print(f"Duplicate skipped: {new_row['Description']} on {new_row['Transaction Date']} for ${new_row['Amount']}")
            else:
                # New transaction - add it
                new_transactions.append(new_row)
        
        print(f"Found {len(new_transactions)} new transactions, {duplicate_count} duplicates")
        
        # Combine existing with new transactions
        if new_transactions:
            new_df_filtered = pd.DataFrame(new_transactions)
            merged_df = pd.concat([existing_df, new_df_filtered], ignore_index=True)
        else:
            merged_df = existing_df.copy()
            print("No new transactions to add")
        
    else:
        # No existing file - all transactions are new
        merged_df = new_df.copy()
        new_count = len(new_df)
        duplicate_count = 0
        print(f"No existing {transaction_type} file found. All {new_count} transactions are new.")
        return merged_df, new_count, duplicate_count
    
    # Generate Transaction IDs for any missing ones
    new_count = len(new_transactions)
    for idx in merged_df.index:
        if pd.isna(merged_df.at[idx, 'Transaction ID']) or \
           (isinstance(merged_df.at[idx, 'Transaction ID'], str) and \
            merged_df.at[idx, 'Transaction ID'].strip() == ''):
            merged_df.at[idx, 'Transaction ID'] = str(uuid.uuid4())
    
    # Reorder columns to put Transaction ID first
    if 'Transaction ID' in merged_df.columns:
        cols = ['Transaction ID'] + [col for col in merged_df.columns if col != 'Transaction ID']
        merged_df = merged_df[cols]
    
    return merged_df, new_count, duplicate_count

