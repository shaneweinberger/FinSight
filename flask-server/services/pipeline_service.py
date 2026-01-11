"""
Pipeline Service for orchestrating the ETL process via Supabase.
"""
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd
import shutil

from etl.extractors import CreditExtractor, DebitExtractor
from etl.transformers import TransactionTransformer
from services.transaction_service import TransactionService
from config import CATEGORIES_FILE

class PipelineService:
    """Orchestrates the ETL pipeline -> Supabase."""
    
    def __init__(self):
        from services import RuleService  # Lazy import
        self.rule_service = RuleService()
        self.credit_extractor = CreditExtractor()
        self.debit_extractor = DebitExtractor()
        self.transformer = TransactionTransformer(CATEGORIES_FILE, self.rule_service)
        self.transaction_service = TransactionService()
        
    def process_file(self, file_path: Path, upload_type: str) -> Dict[str, Any]:
        """
        Process a single new file and import to Supabase.
        """
        try:
            # 1. Extract
            extractor = self.credit_extractor if upload_type == 'credit' else self.debit_extractor
            df = extractor.extract(file_path)
            
            if df.empty:
                return {'success': False, 'error': 'No data extracted'}
                
            # 2. Transform
            df = self.transformer.transform(df, transaction_type=upload_type)
            
            # 3. Load (Import to Supabase)
            stats = self.transaction_service.import_transactions(df)
            
            return {
                'success': True,
                'stats': stats
            }
            
        except Exception as e:
            print(f"Pipeline processing failed: {e}")
            import traceback
            traceback.print_exc()
            return {'success': False, 'error': str(e)}

    # Deprecated methods needed to keep generic calls happy for now?
    # Or strict rewrite? Strict rewrite is cleaner.
    
    def update_transaction(self, transaction_id: str, updates: Dict[str, Any]) -> bool:
        """Proxy to TransactionService."""
        return self.transaction_service.update_transaction(transaction_id, updates)

    def bulk_update_transactions(self, updates: List[Dict[str, Any]]) -> int:
        """Proxy to TransactionService."""
        return self.transaction_service.bulk_update_transactions(updates)
