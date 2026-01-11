"""
Upload service for handling file uploads and ETL processing via Supabase Pipeline.
"""
import os
import shutil
from pathlib import Path
from werkzeug.utils import secure_filename
from typing import Dict, Any, Tuple
from services.pipeline_service import PipelineService
from config import ALLOWED_EXTENSIONS, UPLOADS_DIR

class UploadService:
    """Service for handling file uploads and triggering pipeline."""
    
    def __init__(self):
        self.pipeline_service = PipelineService()
        self.uploads_dir = UPLOADS_DIR
        self.uploads_dir.mkdir(exist_ok=True)
    
    def is_allowed_file(self, filename: str) -> bool:
        """Check if file extension is allowed."""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    def upload_file(self, file, upload_type: str) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Upload and process a CSV file.
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
            
            # Save file temporarily
            filename = secure_filename(file.filename)
            filepath = self.uploads_dir / filename
            file.save(str(filepath))
            
            # Process via Pipeline
            result = self.pipeline_service.process_file(filepath, upload_type)
            
            # Clean up temp file
            if filepath.exists():
                filepath.unlink()
            
            if result['success']:
                stats = result.get('stats', {})
                message = f"File processed successfully. Imported: {stats.get('imported', 0)}, Duplicates: {stats.get('duplicates', 0)}"
                if stats.get('errors', 0) > 0:
                    message += f", Errors: {stats.get('errors')}"
                    
                return True, message, {
                    'filename': filename,
                    'stats': stats
                }
            else:
                return False, f"Processing failed: {result.get('error')}", {}
            
        except Exception as e:
            return False, f"Upload failed: {str(e)}", {}
    
    def list_uploaded_files(self, upload_type: str) -> Dict[str, Any]:
        """List uploaded files (Deprecated/Empty since we don't store them)."""
        return {'files': []}
            
    def delete_uploaded_file(self, upload_type: str, filename: str) -> Tuple[bool, str]:
        """Delete an uploaded file (Deprecated)."""
        return False, "File storage is deprecated. Manage data via Transactions tab."
    
    def reprocess_all_files(self, upload_type: str) -> Tuple[bool, str]:
        """Re-process files (Deprecated)."""
        return False, "Reprocessing is not supported in the new Supabase pipeline yet."
            
    def _sync_updated_files(self) -> None:
        pass
