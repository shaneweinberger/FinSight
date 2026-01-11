import os
import sys
import json
import pandas as pd
from getpass import getpass

# Add parent dir to path to import services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, g
from services.supabase_service import SupabaseService
from services.transaction_service import TransactionService
from config import GOLD_DIR, RULES_FILE

def migrate_data():
    """Migrate local data to Supabase."""
    print("=== FinSight Data Migration ===")
    
    # 1. Authenticate
    email = input("Enter Supabase Email: ")
    password = getpass("Enter Supabase Password: ")
    
    try:
        service = SupabaseService()
        # Create a temp client to login
        auth_client = service.get_client()
        session = auth_client.auth.sign_in_with_password({"email": email, "password": password})
        
        user = session.user
        token = session.session.access_token
        
        print(f"Successfully logged in as {user.email}")
        
    except Exception as e:
        print(f"Login failed: {e}")
        return

    # 2. Setup Context
    app = Flask(__name__)
    
    with app.app_context():
        g.user = user
        g.token = token
        
        transaction_service = TransactionService()
        client = transaction_service.get_client() # Verify we get auth client
        
        # 3. Migrate Transactions
        print("\n--- Migrating Transactions ---")
        
        # Credit
        credit_file = GOLD_DIR / "credit_cleaned_and_updated.csv"
        if credit_file.exists():
            print(f"Importing {credit_file.name}...")
            df = pd.read_csv(credit_file)
            stats = transaction_service.import_transactions(df)
            print(f"Credit Stats: {stats}")
        else:
            print(f"No credit file found at {credit_file}")
            
        # Debit
        debit_file = GOLD_DIR / "debit_cleaned_and_updated.csv"
        if debit_file.exists():
            print(f"Importing {debit_file.name}...")
            df = pd.read_csv(debit_file)
            stats = transaction_service.import_transactions(df)
            print(f"Debit Stats: {stats}")
        else:
             print(f"No debit file found at {debit_file}")
             
        # 4. Migrate Rules
        print("\n--- Migrating Rules ---")
        if RULES_FILE.exists():
            with open(RULES_FILE, 'r') as f:
                try:
                    data = json.load(f)
                    rules = data.get('rules', [])
                    print(f"Found {len(rules)} rules.")
                    
                    count = 0
                    for r in rules:
                        # Check duplicate? Rules table has no unique constraint on content+user?
                        # Let's just insert.
                        client.table('rules').insert({
                            'content': r['content'],
                            'type': r['type'],
                            'user_id': user.id
                        }).execute()
                        count += 1
                    print(f"Imported {count} rules.")
                    
                except Exception as e:
                    print(f"Error importing rules: {e}")
        else:
            print("No rules file found.")
            
    print("\nMigration Complete!")

if __name__ == "__main__":
    migrate_data()
