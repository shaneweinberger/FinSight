import sys
import os
from pathlib import Path

# Add flask-server to path
sys.path.append(os.path.join(os.getcwd(), 'flask-server'))

from services.transaction_service import TransactionService

def check_transactions():
    service = TransactionService()
    transactions = service.get_all_transactions()
    
    print(f"Total transactions: {len(transactions)}")
    
    e_transfer_txs = [tx for tx in transactions if tx.category == 'E-Transfer']
    print(f"E-Transfer transactions: {len(e_transfer_txs)}")
    
    for tx in e_transfer_txs[:5]:
        print(f"  - {tx.description}: {tx.category}")

    # Check if any E-TRANSFER descriptions are still Uncategorized
    uncategorized = [tx for tx in transactions if 'E-TRANSFER' in str(tx.description).upper() and tx.category == 'Uncategorized']
    print(f"Uncategorized E-TRANSFERs: {len(uncategorized)}")
    for tx in uncategorized[:5]:
        print(f"  - {tx.description}: {tx.category}")

if __name__ == "__main__":
    check_transactions()
