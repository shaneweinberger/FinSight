"""
Pipeline Service for orchestrating the ETL process.
"""
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd

from etl.extractors import CreditExtractor, DebitExtractor
from etl.transformers import TransactionTransformer
from etl.loaders import Loader
from config import (
    CREDIT_UPLOADS_DIR, DEBIT_UPLOADS_DIR,
    GOLD_DIR, SILVER_DIR, CATEGORIES_FILE
)

class PipelineService:
    """Orchestrates the ETL pipeline."""
    
    def __init__(self):
        self.credit_extractor = CreditExtractor()
        self.debit_extractor = DebitExtractor()
        self.transformer = TransactionTransformer(CATEGORIES_FILE)
        self.loader = Loader(SILVER_DIR, GOLD_DIR)
        
    def run_pipeline(self, upload_type: str = 'all') -> Dict[str, Any]:
        """Run the full ETL pipeline."""
        results = {
            'credit': {'status': 'skipped', 'count': 0},
            'debit': {'status': 'skipped', 'count': 0}
        }
        
        try:
            # Process Credit
            if upload_type in ['all', 'credit']:
                print("Starting Credit Pipeline...")
                credit_df = self._process_files(
                    CREDIT_UPLOADS_DIR, 
                    self.credit_extractor
                )
                if not credit_df.empty:
                    # Transform
                    credit_df = self.transformer.transform(credit_df)
                    
                    # Save Silver
                    self.loader.save_silver(credit_df, "credit_silver.csv")
                    
                    # Generate Gold (Silver + Overrides)
                    self.loader.generate_gold(credit_df, "credit_cleaned_and_updated.csv")
                    
                    results['credit'] = {'status': 'success', 'count': len(credit_df)}
                else:
                    results['credit'] = {'status': 'no_files', 'count': 0}

            # Process Debit
            if upload_type in ['all', 'debit']:
                print("Starting Debit Pipeline...")
                debit_df = self._process_files(
                    DEBIT_UPLOADS_DIR, 
                    self.debit_extractor
                )
                if not debit_df.empty:
                    # Transform
                    debit_df = self.transformer.transform(debit_df)
                    
                    # Save Silver
                    self.loader.save_silver(debit_df, "debit_silver.csv")
                    
                    # Generate Gold (Silver + Overrides)
                    self.loader.generate_gold(debit_df, "debit_cleaned_and_updated.csv")
                    
                    results['debit'] = {'status': 'success', 'count': len(debit_df)}
                else:
                    results['debit'] = {'status': 'no_files', 'count': 0}
                    
            return {'success': True, 'results': results}
            
        except Exception as e:
            print(f"Pipeline failed: {e}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': str(e)}

    def _process_files(self, directory: Path, extractor) -> pd.DataFrame:
        """Process all CSV files in a directory and combine them."""
        all_dfs = []
        if not directory.exists():
            return pd.DataFrame()
            
        files = sorted([f for f in directory.glob('*.csv')], key=lambda x: x.stat().st_mtime)
        
        for file_path in files:
            try:
                df = extractor.extract(file_path)
                all_dfs.append(df)
            except Exception as e:
                print(f"Error processing file {file_path}: {e}")
                
        if not all_dfs:
            return pd.DataFrame()
            
        return pd.concat(all_dfs, ignore_index=True)

    def update_transaction(self, transaction_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update a transaction by updating the overrides and regenerating Gold.
        Note: This is a simplified version. Ideally we'd find the transaction in Gold,
        get its key fields, update the override, and then regenerate.
        """
        # For now, we need to know which file the transaction is in to find its key fields
        # This is a limitation of not having a persistent ID store.
        # We will search both Gold files.
        
        found = False
        for filename in ["credit_cleaned_and_updated.csv", "debit_cleaned_and_updated.csv"]:
            path = GOLD_DIR / filename
            if not path.exists():
                continue
                
            df = pd.read_csv(path)
            
            # Try to match by ID if available (the loaders generate UUIDs if missing)
            # But wait, the UUIDs are generated on the fly in generate_gold if not present in Silver.
            # Silver doesn't have UUIDs. So UUIDs in Gold are unstable if we regenerate!
            # This is a flaw in the "Overrides" design without a persistent ID store.
            
            # FIX: We must use the content hash for stable identification in this design.
            # The frontend sends an ID. If that ID is a UUID generated by a previous run, it's useless for stable matching
            # unless we persisted it.
            
            # Let's assume the frontend sends the full transaction data needed for matching, 
            # or we look it up by the ID currently in the file.
            
            if 'Transaction ID' in df.columns:
                matches = df[df['Transaction ID'] == transaction_id]
                if not matches.empty:
                    # Found it!
                    row = matches.iloc[0]
                    transaction_data = {
                        'Transaction Date': row['Transaction Date'],
                        'Description': row['Description'],
                        'Amount': row['Amount']
                    }
                    
                    # Update override
                    self.loader.update_override(transaction_data, updates)
                    
                    # Regenerate Gold for this type
                    # We need to know if it was credit or debit.
                    # filename tells us.
                    if "credit" in filename:
                        silver_path = SILVER_DIR / "credit_silver.csv"
                        if silver_path.exists():
                            self.loader.generate_gold(pd.read_csv(silver_path), filename)
                    elif "debit" in filename:
                        silver_path = SILVER_DIR / "debit_silver.csv"
                        if silver_path.exists():
                            self.loader.generate_gold(pd.read_csv(silver_path), filename)
                            
                    found = True
                    break
        
        return found

    def bulk_update_transactions(self, updates: List[Dict[str, Any]]) -> int:
        """
        Bulk update transactions.
        updates: List of dicts with 'id' and 'updates'.
        Returns number of successful updates.
        """
        success_count = 0
        overrides_to_apply = []
        files_to_regenerate = set()
        
        # We need to find the transaction details for each ID to generate the hash
        # Load both Gold files into memory for lookup
        gold_dfs = {}
        for filename in ["credit_cleaned_and_updated.csv", "debit_cleaned_and_updated.csv"]:
            path = GOLD_DIR / filename
            if path.exists():
                gold_dfs[filename] = pd.read_csv(path)
        
        for update in updates:
            transaction_id = update['id']
            changes = update['updates']
            
            # Find transaction in Gold files
            found = False
            for filename, df in gold_dfs.items():
                if 'Transaction ID' in df.columns:
                    matches = df[df['Transaction ID'] == transaction_id]
                    if not matches.empty:
                        row = matches.iloc[0]
                        transaction_data = {
                            'Transaction Date': row['Transaction Date'],
                            'Description': row['Description'],
                            'Amount': row['Amount']
                        }
                        
                        overrides_to_apply.append({
                            'transaction': transaction_data,
                            'updates': changes
                        })
                        
                        files_to_regenerate.add(filename)
                        found = True
                        success_count += 1
                        break
            
            if not found:
                print(f"Warning: Transaction ID {transaction_id} not found for update")

        if overrides_to_apply:
            # Apply all overrides
            self.loader.bulk_update_overrides(overrides_to_apply)
            
            # Regenerate affected Gold files
            for filename in files_to_regenerate:
                if "credit" in filename:
                    silver_path = SILVER_DIR / "credit_silver.csv"
                    if silver_path.exists():
                        self.loader.generate_gold(pd.read_csv(silver_path), filename)
                elif "debit" in filename:
                    silver_path = SILVER_DIR / "debit_silver.csv"
                    if silver_path.exists():
                        self.loader.generate_gold(pd.read_csv(silver_path), filename)
                        
        return success_count
