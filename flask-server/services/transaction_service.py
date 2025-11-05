"""
Transaction service for handling transaction data operations.
"""
import pandas as pd
from typing import List, Dict, Any
from pathlib import Path
import json

from config import GOLD_DIR, CREDIT_CLEANED_FILE, DEBIT_CLEANED_FILE, MERGED_FILE
from models.transaction import Transaction
from utils.csv_initializer import initialize_updated_files, get_updated_file_paths, update_transaction_in_file, bulk_update_transactions_in_file


class TransactionService:
    """Service for managing transaction data."""
    
    def __init__(self):
        self.gold_dir = GOLD_DIR
        self.credit_file = CREDIT_CLEANED_FILE
        self.debit_file = DEBIT_CLEANED_FILE
        self.merged_file = MERGED_FILE
        
        # Initialize updated files on first run
        initialize_updated_files()
    
    def get_all_transactions(self) -> List[Transaction]:
        """
        Retrieve all transactions from updated data files.
        Returns combined credit and debit transactions sorted by date (newest first).
        """
        try:
            # Get updated file paths (fallback to original if updated don't exist)
            updated_files = get_updated_file_paths()
            
            # Process individual files first to ensure IDs are generated and saved
            all_dfs = []
            
            # Process credit file
            if updated_files['credit'].exists():
                credit_df = pd.read_csv(updated_files['credit'])
                if 'Transaction ID' not in credit_df.columns:
                    credit_df['Transaction ID'] = None
                
                # Generate IDs for rows missing them
                import uuid
                needs_credit_save = False
                for idx in credit_df.index:
                    tx_id = credit_df.at[idx, 'Transaction ID']
                    if pd.isna(tx_id) or (isinstance(tx_id, str) and tx_id.strip() == ''):
                        credit_df.at[idx, 'Transaction ID'] = str(uuid.uuid4())
                        needs_credit_save = True
                
                if needs_credit_save:
                    cols = ['Transaction ID'] + [col for col in credit_df.columns if col != 'Transaction ID']
                    credit_df = credit_df[cols]
                    credit_df.to_csv(updated_files['credit'], index=False)
                    print(f"Generated and saved Transaction IDs to credit file")
                
                all_dfs.append(credit_df)
            
            # Process debit file
            if updated_files['debit'].exists():
                debit_df = pd.read_csv(updated_files['debit'])
                if 'Transaction ID' not in debit_df.columns:
                    debit_df['Transaction ID'] = None
                
                # Generate IDs for rows missing them
                import uuid
                needs_debit_save = False
                for idx in debit_df.index:
                    tx_id = debit_df.at[idx, 'Transaction ID']
                    if pd.isna(tx_id) or (isinstance(tx_id, str) and tx_id.strip() == ''):
                        debit_df.at[idx, 'Transaction ID'] = str(uuid.uuid4())
                        needs_debit_save = True
                
                if needs_debit_save:
                    cols = ['Transaction ID'] + [col for col in debit_df.columns if col != 'Transaction ID']
                    debit_df = debit_df[cols]
                    debit_df.to_csv(updated_files['debit'], index=False)
                    print(f"Generated and saved Transaction IDs to debit file")
                
                all_dfs.append(debit_df)
            
            if not all_dfs:
                return []
            
            # Combine the processed dataframes
            df = pd.concat(all_dfs, ignore_index=True)
            
            # Clean and convert to Transaction objects
            transactions = self._dataframe_to_transactions(df)
            
            # Sort by date (newest first)
            transactions.sort(key=lambda x: x.transaction_date, reverse=True)
            
            return transactions
            
        except Exception as e:
            print(f"Error retrieving transactions: {e}")
            return []
    
    def get_categories(self) -> Dict[str, Any]:
        """Get all available categories."""
        categories_file = self.gold_dir / "categories.json"
        
        if not categories_file.exists():
            return {"categories": [], "metadata": {}}
        
        try:
            with open(categories_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading categories: {e}")
            return {"categories": [], "metadata": {}}
    
    def _dataframe_to_transactions(self, df: pd.DataFrame) -> List[Transaction]:
        """Convert DataFrame to list of Transaction objects."""
        transactions = []
        
        # Clean NaN values
        df = df.where(pd.notnull(df), None)
        
        # Ensure Transaction ID column exists - generate IDs for rows that don't have them
        if 'Transaction ID' not in df.columns:
            df['Transaction ID'] = None
        
        for _, row in df.iterrows():
            try:
                # Clean up any remaining NaN values
                clean_row = {}
                for key, value in row.items():
                    if pd.isna(value):
                        clean_row[key] = None
                    else:
                        clean_row[key] = value
                
                transaction = Transaction.from_dict(clean_row)
                transactions.append(transaction)
            except Exception as e:
                print(f"Error creating transaction from row: {e}")
                continue
        
        return transactions
    
    def get_transaction_stats(self) -> Dict[str, Any]:
        """Get basic statistics about transactions."""
        transactions = self.get_all_transactions()
        
        if not transactions:
            return {
                "total_transactions": 0,
                "total_amount": 0.0,
                "credit_count": 0,
                "debit_count": 0,
                "categories": []
            }
        
        total_amount = sum(tx.amount for tx in transactions)
        credit_count = sum(1 for tx in transactions if tx.is_credit)
        debit_count = sum(1 for tx in transactions if tx.is_debit)
        categories = list(set(tx.category for tx in transactions if tx.category))
        
        return {
            "total_transactions": len(transactions),
            "total_amount": total_amount,
            "credit_count": credit_count,
            "debit_count": debit_count,
            "categories": sorted(categories)
        }
    
    def update_transaction(self, transaction_id: str, updates: dict) -> bool:
        """
        Update a single transaction.
        Returns True if successful, False otherwise.
        """
        try:
            updated_files = get_updated_file_paths()
            print(f"Attempting to update transaction {transaction_id} with updates: {updates}")
            print(f"Available files: {[(k, v, v.exists()) for k, v in updated_files.items()]}")
            
            # Try to update in merged file first (only if it has content)
            if updated_files['merged'].exists() and updated_files['merged'].stat().st_size > 0:
                print("Using merged file for update")
                return update_transaction_in_file(updated_files['merged'], transaction_id, updates)
            
            # If no merged file or it's empty, we need to determine which individual file to update
            # For now, we'll try both credit and debit files
            success = False
            if updated_files['credit'].exists():
                print("Trying credit file for update")
                success = update_transaction_in_file(updated_files['credit'], transaction_id, updates)
            if not success and updated_files['debit'].exists():
                print("Trying debit file for update")
                success = update_transaction_in_file(updated_files['debit'], transaction_id, updates)
            
            print(f"Update result: {success}")
            return success
            
        except Exception as e:
            print(f"Error updating transaction {transaction_id}: {e}")
            return False
    
    def bulk_update_transactions(self, updates: list) -> bool:
        """
        Update multiple transactions.
        Updates should be a list of dicts with 'id' and 'updates' keys.
        Returns True if successful, False otherwise.
        """
        try:
            updated_files = get_updated_file_paths()
            
            # Try to update in merged file first (only if it has content)
            if updated_files['merged'].exists() and updated_files['merged'].stat().st_size > 0:
                return bulk_update_transactions_in_file(updated_files['merged'], updates)
            
            # If no merged file or it's empty, try both credit and debit files
            # Different transactions may be in different files, so we need to update all files
            # The bulk_update_transactions_in_file function will only update transactions that exist in each file
            credit_success = False
            debit_success = False
            
            if updated_files['credit'].exists():
                print(f"Attempting to update transactions in credit file: {updated_files['credit']}")
                credit_success = bulk_update_transactions_in_file(updated_files['credit'], updates)
            
            if updated_files['debit'].exists():
                print(f"Attempting to update transactions in debit file: {updated_files['debit']}")
                debit_success = bulk_update_transactions_in_file(updated_files['debit'], updates)
            
            # Consider it successful if at least one file was updated (or if files processed updates)
            # Both files may have been updated since transactions are distributed across them
            return credit_success or debit_success
            
        except Exception as e:
            print(f"Error bulk updating transactions: {e}")
            import traceback
            traceback.print_exc()
            return False
