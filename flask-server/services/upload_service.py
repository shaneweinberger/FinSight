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
            
            # Trigger ETL processing - REMOVED (Handled by PipelineService in app.py)
            # self._trigger_etl(etl_script)
            
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
            # Try reading with headers first
            try:
                df = pd.read_csv(filepath)
            except:
                # If that fails, try without headers (for TD files)
                df = pd.read_csv(filepath, header=None)
            
            return {
                'valid': True,
                'rows': len(df),
                'columns': len(df.columns),
                'columns_list': df.columns.tolist() if hasattr(df.columns, 'tolist') else []
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
        """Trigger ETL script execution and wait for completion."""
        try:
            # Run ETL script and wait for it to complete
            result = subprocess.run(
                ['python3', str(etl_script)],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode == 0:
                print(f"ETL script completed successfully: {etl_script}")
                # Update the updated files after ETL completes
                self._sync_updated_files()
            else:
                print(f"ETL script failed with return code {result.returncode}")
                print(f"Error output: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            print(f"ETL script timed out after 5 minutes: {etl_script}")
        except Exception as e:
            print(f"Error triggering ETL script: {e}")
    
    def list_uploaded_files(self, upload_type: str) -> Dict[str, Any]:
        """List all uploaded files for a given type."""
        try:
            if upload_type == 'credit':
                target_dir = self.credit_uploads_dir
            elif upload_type == 'debit':
                target_dir = self.debit_uploads_dir
            else:
                return {'error': 'Invalid upload type'}
            
            files = []
            if target_dir.exists():
                for file_path in target_dir.glob('*.csv'):
                    stat = file_path.stat()
                    files.append({
                        'filename': file_path.name,
                        'size': stat.st_size,
                        'uploaded': stat.st_mtime,
                        'path': str(file_path)
                    })
            
            # Sort by upload time (newest first)
            files.sort(key=lambda x: x['uploaded'], reverse=True)
            
            return {'files': files}
            
        except Exception as e:
            return {'error': str(e)}
    
    def delete_uploaded_file(self, upload_type: str, filename: str) -> Tuple[bool, str]:
        """Delete an uploaded file."""
        try:
            if upload_type == 'credit':
                target_dir = self.credit_uploads_dir
            elif upload_type == 'debit':
                target_dir = self.debit_uploads_dir
            else:
                return False, 'Invalid upload type'
            
            filepath = target_dir / filename
            if not filepath.exists():
                return False, 'File not found'
            
            filepath.unlink()
            return True, f'File {filename} deleted successfully'
            
        except Exception as e:
            return False, f'Error deleting file: {str(e)}'
    
    def reprocess_all_files(self, upload_type: str) -> Tuple[bool, str]:
        """Re-process all uploaded files by clearing gold files and re-running ETL."""
        try:
            from config import (
                CREDIT_CLEANED_FILE, DEBIT_CLEANED_FILE,
                CREDIT_CLEANED_UPDATED_FILE, DEBIT_CLEANED_UPDATED_FILE
            )
            
            if upload_type == 'credit':
                target_dir = self.credit_uploads_dir
                etl_script = self.credit_etl_script
                cleaned_file = CREDIT_CLEANED_FILE
                updated_file = CREDIT_CLEANED_UPDATED_FILE
            elif upload_type == 'debit':
                target_dir = self.debit_uploads_dir
                etl_script = self.debit_etl_script
                cleaned_file = DEBIT_CLEANED_FILE
                updated_file = DEBIT_CLEANED_UPDATED_FILE
            else:
                return False, 'Invalid upload type'
            
            # Clear the gold files to start fresh
            if cleaned_file.exists():
                cleaned_file.unlink()
                print(f"Cleared {cleaned_file}")
            if updated_file.exists():
                updated_file.unlink()
                print(f"Cleared {updated_file}")
            
            # Process each uploaded file in order (oldest first to maintain chronological order)
            csv_files = sorted([f for f in target_dir.glob('*.csv')], key=lambda x: x.stat().st_mtime)
            
            if not csv_files:
                return False, 'No files to process'
            
            print(f"Re-processing {len(csv_files)} {upload_type} files...")
            
            # Process each file sequentially
            for file_path in csv_files:
                print(f"Processing {file_path.name}...")
                # For now, we'll trigger ETL which processes the latest file
                # We need to modify ETL to process all files, or process them one by one
                # For simplicity, let's process them sequentially
                result = subprocess.run(
                    ['python3', str(etl_script)],
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                
                if result.returncode != 0:
                    print(f"Warning: {file_path.name} processing failed: {result.stderr}")
            
            # After all files are processed, sync to updated file
            if cleaned_file.exists():
                self._sync_updated_files()
            
            return True, f'Re-processed {len(csv_files)} files successfully'
            
        except Exception as e:
            return False, f'Error re-processing: {str(e)}'
    
    def _sync_updated_files(self) -> None:
        """Merge updated files from original cleaned files after ETL, preserving edits."""
        try:
            from config import (
                CREDIT_CLEANED_FILE, DEBIT_CLEANED_FILE,
                CREDIT_CLEANED_UPDATED_FILE, DEBIT_CLEANED_UPDATED_FILE
            )
            from utils.merge_utils import merge_transactions
            
            # Merge credit file - original has new transactions, updated has user edits
            if CREDIT_CLEANED_FILE.exists():
                if CREDIT_CLEANED_FILE.stat().st_mtime > CREDIT_CLEANED_UPDATED_FILE.stat().st_mtime if CREDIT_CLEANED_UPDATED_FILE.exists() else True:
                    # Read the newly processed original file
                    original_df = pd.read_csv(CREDIT_CLEANED_FILE)
                    
                    # If updated file exists, merge preserving edits (categories, etc.)
                    if CREDIT_CLEANED_UPDATED_FILE.exists():
                        updated_df = pd.read_csv(CREDIT_CLEANED_UPDATED_FILE)
                        
                        # Match transactions and preserve edits from updated file
                        # Transactions in updated file with edits take precedence
                        for upd_idx, upd_row in updated_df.iterrows():
                            mask = (
                                (original_df['Transaction Date'] == upd_row['Transaction Date']) &
                                (original_df['Description'] == str(upd_row['Description'])) &
                                (original_df['Amount'] == upd_row['Amount'])
                            )
                            matches = original_df[mask]
                            if len(matches) == 1:
                                orig_idx = matches.index[0]
                                # Preserve Category and Transaction ID from updated file
                                if 'Category' in upd_row and pd.notna(upd_row['Category']):
                                    original_df.at[orig_idx, 'Category'] = upd_row['Category']
                                if 'Transaction ID' in upd_row and pd.notna(upd_row['Transaction ID']):
                                    original_df.at[orig_idx, 'Transaction ID'] = upd_row['Transaction ID']
                        
                        # Now merge new transactions (not in updated file)
                        merged_df, new_count, dup_count = merge_transactions(
                            original_df,
                            CREDIT_CLEANED_UPDATED_FILE,
                            transaction_type='credit'
                        )
                        
                        # Save merged result
                        if 'Transaction ID' not in merged_df.columns:
                            merged_df['Transaction ID'] = None
                        cols = ['Transaction ID'] + [col for col in merged_df.columns if col != 'Transaction ID']
                        merged_df = merged_df[cols]
                        merged_df.to_csv(CREDIT_CLEANED_UPDATED_FILE, index=False)
                        print(f"Merged credit file: {new_count} new, {dup_count} duplicates")
                    else:
                        # No updated file - just copy original
                        if 'Transaction ID' not in original_df.columns:
                            original_df['Transaction ID'] = None
                        cols = ['Transaction ID'] + [col for col in original_df.columns if col != 'Transaction ID']
                        original_df = original_df[cols]
                        original_df.to_csv(CREDIT_CLEANED_UPDATED_FILE, index=False)
                        print(f"Created credit updated file")
            
            # Merge debit file - same logic
            if DEBIT_CLEANED_FILE.exists():
                if DEBIT_CLEANED_FILE.stat().st_mtime > DEBIT_CLEANED_UPDATED_FILE.stat().st_mtime if DEBIT_CLEANED_UPDATED_FILE.exists() else True:
                    # Read the newly processed original file
                    original_df = pd.read_csv(DEBIT_CLEANED_FILE)
                    
                    # If updated file exists, merge preserving edits
                    if DEBIT_CLEANED_UPDATED_FILE.exists():
                        updated_df = pd.read_csv(DEBIT_CLEANED_UPDATED_FILE)
                        
                        # Match transactions and preserve edits from updated file
                        for upd_idx, upd_row in updated_df.iterrows():
                            mask = (
                                (original_df['Transaction Date'] == upd_row['Transaction Date']) &
                                (original_df['Description'] == str(upd_row['Description'])) &
                                (original_df['Amount'] == upd_row['Amount'])
                            )
                            matches = original_df[mask]
                            if len(matches) == 1:
                                orig_idx = matches.index[0]
                                # Preserve Category and Transaction ID from updated file
                                if 'Category' in upd_row and pd.notna(upd_row['Category']):
                                    original_df.at[orig_idx, 'Category'] = upd_row['Category']
                                if 'Transaction ID' in upd_row and pd.notna(upd_row['Transaction ID']):
                                    original_df.at[orig_idx, 'Transaction ID'] = upd_row['Transaction ID']
                        
                        # Merge new transactions
                        merged_df, new_count, dup_count = merge_transactions(
                            original_df,
                            DEBIT_CLEANED_UPDATED_FILE,
                            transaction_type='debit'
                        )
                        
                        # Save merged result
                        if 'Transaction ID' not in merged_df.columns:
                            merged_df['Transaction ID'] = None
                        cols = ['Transaction ID'] + [col for col in merged_df.columns if col != 'Transaction ID']
                        merged_df = merged_df[cols]
                        merged_df.to_csv(DEBIT_CLEANED_UPDATED_FILE, index=False)
                        print(f"Merged debit file: {new_count} new, {dup_count} duplicates")
                    else:
                        # No updated file - just copy original
                        if 'Transaction ID' not in original_df.columns:
                            original_df['Transaction ID'] = None
                        cols = ['Transaction ID'] + [col for col in original_df.columns if col != 'Transaction ID']
                        original_df = original_df[cols]
                        original_df.to_csv(DEBIT_CLEANED_UPDATED_FILE, index=False)
                        print(f"Created debit updated file")
                    
        except Exception as e:
            print(f"Error syncing updated files: {e}")
            import traceback
            traceback.print_exc()
