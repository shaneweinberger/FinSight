"""
Transaction service for handling transaction data operations via Supabase.
"""
from typing import List, Dict, Any
from flask import g
from services.supabase_service import SupabaseService
from models.transaction import Transaction

class TransactionService:
    """Service for managing transaction data via Supabase."""
    
    def __init__(self):
        # We no longer need file paths
        pass
    
    def get_client(self):
        """Get the authenticated Supabase client for the current user."""
        if 'token' not in g:
            # If called outside of request context or without auth, 
            # we might want to throw error or handle gracefully.
            # For now, assume it's used within @require_auth routes.
            raise Exception("No authenticated user found")
        return SupabaseService.get_auth_client(g.token)

    def get_all_transactions(self) -> List[Transaction]:
        """
        Retrieve all transactions for the current user.
        """
        try:
            client = self.get_client()
            # Select all fields, order by transaction_date desc
            response = client.table('transactions')\
                .select('*')\
                .order('transaction_date', desc=True)\
                .execute()
            
            data = response.data
            transactions = []
            
            for row in data:
                # Map Supabase row to Transaction model
                # Note: 'id' is the internal UUID, 'transaction_id' is the optional text ID
                # The model uses 'transaction_id' to store... wait. 
                # Model 'transaction_id' field maps to 'Transaction ID' in dict.
                # In DB: 'id' (uuid), 'transaction_id' (text, legacy).
                
                # Let's map DB 'id' -> Model 'transaction_id' for consistency in identifying records
                # OR use the 'transaction_id' field if we want to preserve legacy IDs?
                # The frontend likely expects an ID to update.
                
                t = Transaction(
                    transaction_date=row['transaction_date'],
                    description=row['description'],
                    category=row['category'],
                    amount=row['amount'],
                    transaction_id=row['id'] # Use the Supabase UUID as the main ID
                )
                transactions.append(t)
                
            return transactions
            
        except Exception as e:
            print(f"Error retrieving transactions: {e}")
            return []
    
    def get_categories(self) -> Dict[str, Any]:
        """Get all available categories for the current user."""
        try:
            client = self.get_client()
            response = client.table('categories').select('name').order('name').execute()
            
            categories = [row['name'] for row in response.data]
            
            return {
                "categories": categories,
                "metadata": {
                    "total_categories": len(categories)
                }
            }
        except Exception as e:
            print(f"Error loading categories: {e}")
            return {"categories": [], "metadata": {}}

    def add_category(self, category_name: str) -> bool:
        """Add a new category."""
        try:
            client = self.get_client()
            if not category_name or not category_name.strip():
                return False
                
            client.table('categories').insert({'name': category_name.strip(), 'user_id': g.user.id}).execute()
            return True
        except Exception as e:
            print(f"Error adding category: {e}")
            return False

    def delete_category(self, category_name: str) -> bool:
        """Delete a category."""
        try:
            client = self.get_client()
            client.table('categories').delete().eq('name', category_name).execute()
            return True
        except Exception as e:
            print(f"Error deleting category: {e}")
            return False
    
    def get_transaction_stats(self) -> Dict[str, Any]:
        """Get basic statistics about transactions."""
        # We can do this with SQL aggregation or just fetch all (if not too many)
        # Fetching all is easier for now to reuse logic
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
    
    
    def import_transactions(self, df: pd.DataFrame) -> dict:
        """
        Import transactions from a DataFrame.
        Handles deduplication against existing data.
        Returns stats: {'imported': int, 'duplicates': int, 'errors': int}
        """
        results = {'imported': 0, 'duplicates': 0, 'errors': 0}
        
        try:
            client = self.get_client()
            user_id = g.user.id
            
            if df.empty:
                return results
                
            # Clean dataframe
            df = df.where(pd.notnull(df), None)
            
            # 1. Fetch existing transactions to verify duplicates
            # Optimization: Fetch only transactions with matching amounts/dates?
            # For now, let's fetch all (assuming < 10k transactions). 
            # If large, we should filter by date range of the input DF.
            
            # Determine date range of input
            df['Transaction Date'] = pd.to_datetime(df['Transaction Date'])
            min_date = df['Transaction Date'].min().strftime('%Y-%m-%d')
            max_date = df['Transaction Date'].max().strftime('%Y-%m-%d')
            
            # Fetch existing for this range
            existing_response = client.table('transactions')\
                .select('transaction_date, description, amount')\
                .gte('transaction_date', min_date)\
                .lte('transaction_date', max_date)\
                .execute()
                
            existing = existing_response.data
            
            # Build set of existing signatures: (date, description, amount)
            # Note: Amount comparison needs care (float vs decimal).
            # Let's stringify amount to 2 decimal places for comparison?
            existing_sigs = set()
            for r in existing:
                amt = float(r['amount']) if r['amount'] is not None else 0.0
                sig = (
                    r['transaction_date'], 
                    r['description'].strip(), 
                    round(amt, 2)
                )
                existing_sigs.add(sig)
            
            # 2. Filter new transactions
            new_rows = []
            
            for _, row in df.iterrows():
                try:
                    t_date = row['Transaction Date'].strftime('%Y-%m-%d')
                    desc = str(row['Description']).strip()
                    amt = float(row['Amount']) if row['Amount'] is not None else 0.0
                    
                    sig = (t_date, desc, round(amt, 2))
                    
                    if sig in existing_sigs:
                        results['duplicates'] += 1
                        continue
                    
                    # Prepare for insert
                    new_rows.append({
                        'user_id': user_id,
                        'transaction_date': t_date,
                        'description': desc,
                        'category': row['Category'] if row['Category'] else 'Uncategorized',
                        'amount': amt,
                        # 'transaction_id': row.get('Transaction ID') # Optional legacy ID
                    })
                    
                    # Add to sigs to prevent duplicates WITHIN the import file
                    existing_sigs.add(sig)
                    
                except Exception as row_e:
                    print(f"Error processing row for import: {row_e}")
                    results['errors'] += 1
            
            # 3. Bulk Insert
            if new_rows:
                # Supabase batch insert
                batch_size = 100
                for i in range(0, len(new_rows), batch_size):
                    batch = new_rows[i:i+batch_size]
                    client.table('transactions').insert(batch).execute()
                    results['imported'] += len(batch)
                    
            return results
            
        except Exception as e:
            print(f"Error importing transactions: {e}")
            import traceback
            traceback.print_exc()
            return results

    def update_transaction(self, transaction_id: str, updates: dict) -> bool:
        """
        Update a single transaction.
        """
        try:
            client = self.get_client()
            
            # Map frontend keys to DB keys
            # updates keys are likely 'Category', 'Description' (capitalized) logic from frontend?
            # Or 'category', 'description'.
            db_updates = {}
            if 'category' in updates: db_updates['category'] = updates['category']
            if 'Category' in updates: db_updates['category'] = updates['Category']
            if 'description' in updates: db_updates['description'] = updates['description']
            if 'Description' in updates: db_updates['description'] = updates['Description']
            if 'amount' in updates: db_updates['amount'] = updates['amount']
            if 'Amount' in updates: db_updates['amount'] = updates['Amount']
            
            if not db_updates:
                return False
            
            client.table('transactions').update(db_updates).eq('id', transaction_id).execute()
            return True
            
        except Exception as e:
            print(f"Error updating transaction {transaction_id}: {e}")
            return False
    
    def bulk_update_transactions(self, updates: list) -> bool:
        """
        Update multiple transactions.
        Updates: list of dicts with 'id' and 'updates'.
        """
        try:
            # Supabase doesn't support bulk update with different values per row easily in one call
            # unless we use upsert with all data specified.
            # Since we are patching potentially partial updates, loop is safer for now.
            # Performance note: For huge lists this is slow. 
            count = 0
            for update_item in updates:
                tx_id = update_item.get('id')
                tx_updates = update_item.get('updates')
                if tx_id and tx_updates:
                    if self.update_transaction(tx_id, tx_updates):
                        count += 1
            return count > 0
        except Exception as e:
            print(f"Error bulk updating transactions: {e}")
            return False
