import sys
import os
from pathlib import Path

# Add flask-server to path
sys.path.append(os.path.join(os.getcwd(), 'flask-server'))

from services.pipeline_service import PipelineService

def test_pipeline():
    print("Testing Pipeline Service...")
    service = PipelineService()
    
    # Run for both credit and debit
    result = service.run_pipeline('all')
    print("Pipeline Result:", result)
    
    if result['success']:
        print("\nVerifying output files...")
        gold_dir = Path('flask-server/data/gold')
        
        credit_file = gold_dir / 'credit_cleaned_and_updated.csv'
        if credit_file.exists():
            print(f"Credit file exists: {credit_file}")
            with open(credit_file, 'r') as f:
                print(f"Credit lines: {len(f.readlines())}")
        else:
            print("Credit file MISSING!")
            
        debit_file = gold_dir / 'debit_cleaned_and_updated.csv'
        if debit_file.exists():
            print(f"Debit file exists: {debit_file}")
            with open(debit_file, 'r') as f:
                print(f"Debit lines: {len(f.readlines())}")
        else:
            print("Debit file MISSING!")

if __name__ == "__main__":
    test_pipeline()
