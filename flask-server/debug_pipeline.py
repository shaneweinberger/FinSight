import sys
import os
from pathlib import Path
import pandas as pd

# Add current directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.pipeline_service import PipelineService
from config import CREDIT_UPLOADS_DIR, DEBIT_UPLOADS_DIR, CREDIT_CLEANED_UPDATED_FILE, DEBIT_CLEANED_UPDATED_FILE

def debug_pipeline():
    print("=== Starting Pipeline Debug ===")
    
    # Check Directories
    print(f"Credit Uploads Dir: {CREDIT_UPLOADS_DIR} (Exists: {CREDIT_UPLOADS_DIR.exists()})")
    if CREDIT_UPLOADS_DIR.exists():
        files = list(CREDIT_UPLOADS_DIR.glob('*.csv'))
        print(f"Credit Files Found: {[f.name for f in files]}")
    
    print(f"Debit Uploads Dir: {DEBIT_UPLOADS_DIR} (Exists: {DEBIT_UPLOADS_DIR.exists()})")
    if DEBIT_UPLOADS_DIR.exists():
        files = list(DEBIT_UPLOADS_DIR.glob('*.csv'))
        print(f"Debit Files Found: {[f.name for f in files]}")

    # Run Pipeline
    pipeline = PipelineService()
    print("\n=== Running Credit Pipeline ===")
    try:
        result = pipeline.run_pipeline('credit')
        print(f"Result: {result}")
    except Exception as e:
        print(f"Pipeline Execution Failed: {e}")
        import traceback
        traceback.print_exc()

    print("\n=== Running Debit Pipeline ===")
    try:
        result = pipeline.run_pipeline('debit')
        print(f"Result: {result}")
    except Exception as e:
        print(f"Pipeline Execution Failed: {e}")
        import traceback
        traceback.print_exc()

    # Check Output
    print("\n=== Checking Output ===")
    print(f"Credit Output File: {CREDIT_CLEANED_UPDATED_FILE} (Exists: {CREDIT_CLEANED_UPDATED_FILE.exists()})")
    if CREDIT_CLEANED_UPDATED_FILE.exists():
        df = pd.read_csv(CREDIT_CLEANED_UPDATED_FILE)
        print(f"Output Rows: {len(df)}")
        print("Head:")
        print(df.head())
    
if __name__ == "__main__":
    debug_pipeline()
