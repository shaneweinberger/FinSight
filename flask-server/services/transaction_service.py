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
            
            # Try to get merged data first
            if updated_files['merged'].exists() and updated_files['merged'].stat().st_size > 0:
                df = pd.read_csv(updated_files['merged'])
            else:
                # Combine individual files
                all_dfs = []
                
                if updated_files['credit'].exists():
                    credit_df = pd.read_csv(updated_files['credit'])
                    all_dfs.append(credit_df)
                
                if updated_files['debit'].exists():
                    debit_df = pd.read_csv(updated_files['debit'])
                    all_dfs.append(debit_df)
                
                if not all_dfs:
                    return []
                
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
            
            # If no merged file or it's empty, we need to determine which individual file to update
            # For now, we'll try both credit and debit files
            success = False
            if updated_files['credit'].exists():
                success = bulk_update_transactions_in_file(updated_files['credit'], updates)
            if not success and updated_files['debit'].exists():
                success = bulk_update_transactions_in_file(updated_files['debit'], updates)
            
            return success
            
        except Exception as e:
            print(f"Error bulk updating transactions: {e}")
            return False
