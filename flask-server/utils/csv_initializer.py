"""
Utility for initializing updated CSV files from original cleaned files.
"""
import pandas as pd
import shutil
from pathlib import Path
from typing import Tuple, Dict

from config import (
    CREDIT_CLEANED_UPDATED_FILE,
    DEBIT_CLEANED_UPDATED_FILE,
    # MERGED_UPDATED_FILE, # Deprecated
    CREDIT_CLEANED_FILE,
    DEBIT_CLEANED_FILE,
    # MERGED_FILE # Deprecated
)


def initialize_updated_files() -> Tuple[bool, str]:
    """
    Initialize the updated CSV files by copying from original cleaned files.
    Returns (success, message).
    """
    try:
        # Initialize credit file
        if not CREDIT_CLEANED_UPDATED_FILE.exists():
            if CREDIT_CLEANED_FILE.exists():
                shutil.copy2(CREDIT_CLEANED_FILE, CREDIT_CLEANED_UPDATED_FILE)
                print(f"Initialized {CREDIT_CLEANED_UPDATED_FILE} from original")
            else:
                # Create empty with headers if original doesn't exist
                pd.DataFrame(columns=['Transaction ID', 'Transaction Date', 'Description', 'Category', 'Amount']).to_csv(CREDIT_CLEANED_UPDATED_FILE, index=False)
                print(f"Created empty {CREDIT_CLEANED_UPDATED_FILE}")

        # Initialize debit file
        if not DEBIT_CLEANED_UPDATED_FILE.exists():
            if DEBIT_CLEANED_FILE.exists():
                shutil.copy2(DEBIT_CLEANED_FILE, DEBIT_CLEANED_UPDATED_FILE)
                print(f"Initialized {DEBIT_CLEANED_UPDATED_FILE} from original")
            else:
                # Create empty with headers
                pd.DataFrame(columns=['Transaction ID', 'Transaction Date', 'Description', 'Category', 'Amount']).to_csv(DEBIT_CLEANED_UPDATED_FILE, index=False)
                print(f"Created empty {DEBIT_CLEANED_UPDATED_FILE}")

        # Merged file is deprecated in new pipeline
        # if not MERGED_UPDATED_FILE.exists():
        #     if MERGED_FILE.exists():
        #         shutil.copy2(MERGED_FILE, MERGED_UPDATED_FILE)
        #         print(f"Initialized {MERGED_UPDATED_FILE} from original")
        
        return True, "Updated CSV files initialized successfully"
        
    except Exception as e:
        return False, f"Error initializing updated files: {str(e)}"


def get_updated_file_paths() -> Dict[str, Path]:
    """Get paths to the updated files."""
    return {
        'credit': CREDIT_CLEANED_UPDATED_FILE,
        'debit': DEBIT_CLEANED_UPDATED_FILE,
        # 'merged': MERGED_UPDATED_FILE # Deprecated
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
        
        # Ensure Transaction ID column exists in DataFrame
        if 'Transaction ID' not in df.columns:
            df['Transaction ID'] = None
            print("Added Transaction ID column to DataFrame")
        
        # Apply all updates to the in-memory DataFrame
        for update_item in updates:
            # The 'id' field should now be the Transaction ID (UUID), not the array index
            transaction_id = update_item.get('id')
            transaction_data = update_item.get('transactionData', {})
            updates_dict = update_item.get('updates', {})
            
            print(f"Processing update for transaction ID: {transaction_id}")
            print(f"Transaction data: {transaction_data}")
            print(f"Updates: {updates_dict}")
            
            # Find the row by Transaction ID (preferred method)
            idx = None
            
            # Try to match by Transaction ID first (most reliable)
            if transaction_id and 'Transaction ID' in df.columns:
                matching_rows = df[df['Transaction ID'] == transaction_id]
                if len(matching_rows) == 1:
                    idx = matching_rows.index[0]
                    print(f"Found transaction at index {idx} by Transaction ID: {transaction_id}")
                elif len(matching_rows) > 1:
                    print(f"ERROR: Multiple transactions found with same Transaction ID {transaction_id}")
                    print("This should never happen - Transaction IDs must be unique!")
                    continue
                elif len(matching_rows) == 0:
                    print(f"WARNING: No transaction found with Transaction ID: {transaction_id}")
            
            # Fallback: Try to match by content if Transaction ID not found
            if idx is None and transaction_data:
                print("Falling back to content-based matching (legacy support)")
                required_fields = ['Transaction Date', 'Description', 'Amount']
                missing_fields = [f for f in required_fields if f not in transaction_data or not transaction_data[f]]
                
                if not missing_fields:
                    mask = (
                        (df['Transaction Date'] == transaction_data['Transaction Date']) &
                        (df['Description'] == transaction_data['Description']) &
                        (df['Amount'] == transaction_data['Amount'])
                    )
                    matching_rows = df[mask]
                    
                    if len(matching_rows) == 1:
                        idx = matching_rows.index[0]
                        print(f"Found transaction at index {idx} by content match")
                        # Generate and save Transaction ID for this row if it doesn't have one
                        if pd.isna(df.at[idx, 'Transaction ID']):
                            import uuid
                            df.at[idx, 'Transaction ID'] = str(uuid.uuid4())
                            print(f"Generated Transaction ID for this row: {df.at[idx, 'Transaction ID']}")
                    elif len(matching_rows) > 1:
                        print(f"ERROR: Multiple matching transactions found ({len(matching_rows)} rows). Cannot safely update.")
                        continue
                    elif len(matching_rows) == 0:
                        print(f"WARNING: No matching transaction found by content.")
            
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
        
        # Ensure Transaction ID column is saved (reorder columns to put it first for readability)
        if 'Transaction ID' in df.columns:
            cols = ['Transaction ID'] + [col for col in df.columns if col != 'Transaction ID']
            df = df[cols]
        
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
