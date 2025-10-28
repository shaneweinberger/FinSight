"""
Utility for initializing updated CSV files from original cleaned files.
"""
import pandas as pd
import shutil
from pathlib import Path
from typing import Tuple

from config import (
    CREDIT_CLEANED_FILE, DEBIT_CLEANED_FILE, MERGED_FILE,
    CREDIT_CLEANED_UPDATED_FILE, DEBIT_CLEANED_UPDATED_FILE, MERGED_UPDATED_FILE
)


def initialize_updated_files() -> Tuple[bool, str]:
    """
    Initialize the updated CSV files by copying from original cleaned files.
    Returns (success, message).
    """
    try:
        # Initialize credit updated file
        if CREDIT_CLEANED_FILE.exists() and not CREDIT_CLEANED_UPDATED_FILE.exists():
            shutil.copy2(CREDIT_CLEANED_FILE, CREDIT_CLEANED_UPDATED_FILE)
            print(f"Initialized {CREDIT_CLEANED_UPDATED_FILE}")
        
        # Initialize debit updated file
        if DEBIT_CLEANED_FILE.exists() and not DEBIT_CLEANED_UPDATED_FILE.exists():
            shutil.copy2(DEBIT_CLEANED_FILE, DEBIT_CLEANED_UPDATED_FILE)
            print(f"Initialized {DEBIT_CLEANED_UPDATED_FILE}")
        
        # Initialize merged updated file
        if MERGED_FILE.exists() and not MERGED_UPDATED_FILE.exists():
            shutil.copy2(MERGED_FILE, MERGED_UPDATED_FILE)
            print(f"Initialized {MERGED_UPDATED_FILE}")
        
        return True, "Updated CSV files initialized successfully"
        
    except Exception as e:
        return False, f"Error initializing updated files: {str(e)}"


def get_updated_file_paths() -> dict:
    """
    Get the paths to the updated CSV files, falling back to original files if updated don't exist.
    """
    return {
        'credit': CREDIT_CLEANED_UPDATED_FILE if CREDIT_CLEANED_UPDATED_FILE.exists() else CREDIT_CLEANED_FILE,
        'debit': DEBIT_CLEANED_UPDATED_FILE if DEBIT_CLEANED_UPDATED_FILE.exists() else DEBIT_CLEANED_FILE,
        'merged': MERGED_UPDATED_FILE if MERGED_UPDATED_FILE.exists() else MERGED_FILE
    }


def update_transaction_in_file(file_path: Path, transaction_id: str, updates: dict) -> bool:
    """
    Update a specific transaction in a CSV file.
    Returns True if successful, False otherwise.
    """
    try:
        # Read the CSV file
        df = pd.read_csv(file_path)
        print(f"Updating transaction {transaction_id} in {file_path}")
        print(f"DataFrame shape: {df.shape}")
        print(f"Updates: {updates}")
        
        # Use the index as the ID (transaction_id should be the row index)
        if transaction_id.isdigit():
            idx = int(transaction_id)
            print(f"Transaction index: {idx}, DataFrame length: {len(df)}")
            
            if 0 <= idx < len(df):
                print(f"Before update - Row {idx}: {df.iloc[idx].to_dict()}")
                
                # Update the specified fields
                for field, value in updates.items():
                    if field in df.columns:
                        df.at[idx, field] = value
                        print(f"Updated {field} to {value}")
                    else:
                        print(f"Field {field} not found in columns: {list(df.columns)}")
                
                # Write back to file
                df.to_csv(file_path, index=False)
                print(f"After update - Row {idx}: {df.iloc[idx].to_dict()}")
                print(f"Successfully updated transaction {idx} in {file_path}")
                return True
            else:
                print(f"Index {idx} out of range for DataFrame of length {len(df)}")
        
        print(f"Invalid transaction ID: {transaction_id}")
        return False
        
    except Exception as e:
        print(f"Error updating transaction in {file_path}: {e}")
        return False



def update_transaction_by_content(file_path: Path, transaction_data: dict, updates: dict) -> bool:
    """
    Update a transaction by finding it based on its content (date, description, amount).
    Returns True if successful, False otherwise.
    """
    try:
        # Read the CSV file
        df = pd.read_csv(file_path)
        print(f"Finding transaction by content in {file_path}")
        print(f"Looking for: {transaction_data}")
        print(f"Updates: {updates}")
        
        # Find the transaction by matching key fields
        mask = pd.Series([True] * len(df))
        
        # Match on available fields
        if 'Transaction Date' in transaction_data:
            mask &= (df['Transaction Date'] == transaction_data['Transaction Date'])
        if 'Description' in transaction_data:
            mask &= (df['Description'] == transaction_data['Description'])
        if 'Amount' in transaction_data:
            mask &= (df['Amount'] == transaction_data['Amount'])
        
        matching_rows = df[mask]
        
        if len(matching_rows) == 0:
            print("No matching transaction found")
            return False
        elif len(matching_rows) > 1:
            print(f"Multiple matching transactions found: {len(matching_rows)}")
            return False
        
        # Get the index of the matching row
        idx = matching_rows.index[0]
        print(f"Found transaction at index {idx}: {df.iloc[idx].to_dict()}")
        
        # Update the specified fields
        for field, value in updates.items():
            if field in df.columns:
                df.at[idx, field] = value
                print(f"Updated {field} to {value}")
            else:
                print(f"Field {field} not found in columns: {list(df.columns)}")
        
        # Write back to file
        df.to_csv(file_path, index=False)
        print(f"After update - Row {idx}: {df.iloc[idx].to_dict()}")
        print(f"Successfully updated transaction at index {idx} in {file_path}")
        return True
        
    except Exception as e:
        print(f"Error updating transaction by content in {file_path}: {e}")
        return False


def bulk_update_transactions_in_file(file_path: Path, updates: list) -> bool:
    """
    Update multiple transactions in a CSV file.
    Updates should be a list of dicts with 'id', 'transactionData', and 'updates' keys.
    Returns True if successful, False otherwise.
    """
    try:
        # Read the CSV file once
        df = pd.read_csv(file_path)
        print(f"Reading CSV file: {file_path}, shape: {df.shape}")
        
        # Apply all updates to the in-memory DataFrame
        for update_item in updates:
            transaction_id = update_item.get('id')
            transaction_data = update_item.get('transactionData', {})
            updates_dict = update_item.get('updates', {})
            
            print(f"Processing update for transaction {transaction_id}")
            print(f"Transaction data: {transaction_data}")
            print(f"Updates: {updates_dict}")
            
            # Find the row index by matching content
            idx = None
            found_by_match = False
            
            if transaction_data:
                # Match on available fields
                mask = pd.Series([True] * len(df))
                matching_fields = []
                
                if 'Transaction Date' in transaction_data and transaction_data['Transaction Date']:
                    mask &= (df['Transaction Date'] == transaction_data['Transaction Date'])
                    matching_fields.append('Transaction Date')
                if 'Description' in transaction_data and transaction_data['Description']:
                    mask &= (df['Description'] == transaction_data['Description'])
                    matching_fields.append('Description')
                if 'Amount' in transaction_data and transaction_data['Amount']:
                    mask &= (df['Amount'] == transaction_data['Amount'])
                    matching_fields.append('Amount')
                
                matching_rows = df[mask]
                
                if len(matching_rows) == 1:
                    idx = matching_rows.index[0]
                    found_by_match = True
                    print(f"Found transaction at index {idx} by content match on fields: {matching_fields}")
                elif len(matching_rows) > 1:
                    print(f"WARNING: Multiple matching transactions found ({len(matching_rows)} rows). Fields: {matching_fields}")
                    # Use the first match anyway
                    idx = matching_rows.index[0]
                    found_by_match = True
                    print(f"Using first matching transaction at index {idx}")
                elif len(matching_rows) == 0:
                    print(f"WARNING: No matching transaction found. Fields: {matching_fields}")
                    print(f"Transaction data was: {transaction_data}")
            
            # Fallback to index-based update
            if idx is None and transaction_id and transaction_id.isdigit():
                idx = int(transaction_id)
                if 0 <= idx < len(df):
                    print(f"Using transaction ID as index: {idx}")
                else:
                    print(f"Index {idx} out of range for DataFrame of length {len(df)}")
                    idx = None
            
            # Skip if we couldn't find a valid index
            if idx is None:
                print(f"Could not determine row index for transaction. Skipping this update.")
                continue
            
            # Apply updates to the DataFrame
            print(f"Before update - Row {idx}: {df.iloc[idx].to_dict()}")
            
            for field, value in updates_dict.items():
                if field in df.columns:
                    df.at[idx, field] = value
                    print(f"Updated {field} to {value} at index {idx}")
                else:
                    print(f"Field {field} not found in columns: {list(df.columns)}")
            
            print(f"After update - Row {idx}: {df.iloc[idx].to_dict()}")
        
        # Write back to file once with all updates
        print(f"Writing updated DataFrame to {file_path}")
        df.to_csv(file_path, index=False)
        print(f"Successfully saved all updates to {file_path}")
        return True
        
    except Exception as e:
        print(f"Error bulk updating transactions in {file_path}: {e}")
        import traceback
        traceback.print_exc()
        return False
