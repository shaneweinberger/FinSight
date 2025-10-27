"""
Upload service for handling file uploads and ETL processing.
"""
import os
import subprocess
import pandas as pd
from pathlib import Path
from werkzeug.utils import secure_filename
from typing import Dict, Any, Tuple

from config import (
    CREDIT_UPLOADS_DIR, 
    DEBIT_UPLOADS_DIR, 
    CREDIT_ETL_SCRIPT, 
    DEBIT_ETL_SCRIPT,
    ALLOWED_EXTENSIONS
)


class UploadService:
    """Service for handling file uploads and ETL processing."""
    
    def __init__(self):
        self.credit_uploads_dir = CREDIT_UPLOADS_DIR
        self.debit_uploads_dir = DEBIT_UPLOADS_DIR
        self.credit_etl_script = CREDIT_ETL_SCRIPT
        self.debit_etl_script = DEBIT_ETL_SCRIPT
    
    def is_allowed_file(self, filename: str) -> bool:
        """Check if file extension is allowed."""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    def upload_file(self, file, upload_type: str) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Upload and process a CSV file.
        
        Args:
            file: The uploaded file object
            upload_type: 'credit' or 'debit'
            
        Returns:
            Tuple of (success, message, data)
        """
        try:
            # Validate upload type
            if upload_type not in ['credit', 'debit']:
                return False, "Invalid upload type. Must be 'credit' or 'debit'.", {}
            
            # Validate file
            if not file or file.filename == '':
                return False, "No file selected.", {}
            
            if not self.is_allowed_file(file.filename):
                return False, "Only CSV files are allowed.", {}
            
            # Determine target directory and ETL script
            if upload_type == 'credit':
                target_dir = self.credit_uploads_dir
                etl_script = self.credit_etl_script
            else:
                target_dir = self.debit_uploads_dir
                etl_script = self.debit_etl_script
            
            # Ensure target directory exists
            target_dir.mkdir(exist_ok=True)
            
            # Save file
            filename = secure_filename(file.filename)
            filepath = target_dir / filename
            file.save(str(filepath))
            
            # Validate CSV file
            validation_result = self._validate_csv(filepath)
            if not validation_result['valid']:
                # Remove invalid file
                filepath.unlink()
                return False, f"Invalid CSV file: {validation_result['error']}", {}
            
            # Trigger ETL processing
            self._trigger_etl(etl_script)
            
            return True, "File uploaded successfully", {
                'filename': filename,
                'rows': validation_result['rows'],
                'columns': validation_result['columns'],
                'columns_list': validation_result['columns_list']
            }
            
        except Exception as e:
            return False, f"Upload failed: {str(e)}", {}
    
    def _validate_csv(self, filepath: Path) -> Dict[str, Any]:
        """Validate CSV file and return metadata."""
        try:
            df = pd.read_csv(filepath)
            return {
                'valid': True,
                'rows': len(df),
                'columns': len(df.columns),
                'columns_list': df.columns.tolist()
            }
        except Exception as e:
            return {
                'valid': False,
                'error': str(e),
                'rows': 0,
                'columns': 0,
                'columns_list': []
            }
    
    def _trigger_etl(self, etl_script: Path) -> None:
        """Trigger ETL script execution."""
        try:
            subprocess.Popen(['python3', str(etl_script)])
            print(f"ETL script triggered: {etl_script}")
        except Exception as e:
            print(f"Error triggering ETL script: {e}")
