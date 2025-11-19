"""
Loaders for saving processed data and managing state (Silver/Gold layers).
"""
import pandas as pd
import json
import uuid
from pathlib import Path
from typing import Dict, Any, List

class Loader:
    """Handles saving data and managing the Overrides state."""
    
    def __init__(self, silver_dir: Path, gold_dir: Path):
        self.silver_dir = silver_dir
        self.gold_dir = gold_dir
        self.overrides_file = gold_dir / "overrides.json"
        
        # Ensure directories exist
        self.silver_dir.mkdir(parents=True, exist_ok=True)
        self.gold_dir.mkdir(parents=True, exist_ok=True)

    def load_overrides(self) -> Dict[str, Dict[str, Any]]:
        """Load user overrides from JSON file."""
        if not self.overrides_file.exists():
            return {}
        try:
            with open(self.overrides_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading overrides: {e}")
            return {}

    def save_overrides(self, overrides: Dict[str, Dict[str, Any]]):
        """Save user overrides to JSON file."""
        with open(self.overrides_file, 'w') as f:
            json.dump(overrides, f, indent=2)

    def save_silver(self, df: pd.DataFrame, filename: str) -> Path:
        """Save cleaned data to Silver layer."""
        path = self.silver_dir / filename
        df.to_csv(path, index=False)
        print(f"Saved Silver data to {path}")
        return path

    def generate_gold(self, silver_df: pd.DataFrame, filename: str) -> Path:
        """
        Generate Gold layer by applying overrides to Silver data.
        Gold = Silver + Overrides
        """
        df = silver_df.copy()
        overrides = self.load_overrides()
        
        # Ensure Transaction ID exists
        if 'Transaction ID' not in df.columns:
            df['Transaction ID'] = [str(uuid.uuid4()) for _ in range(len(df))]
        
        # Apply overrides
        # We need a way to match overrides to transactions.
        # Ideally, we should have stable IDs.
        # For now, if we don't have stable IDs from source, we might rely on (Date, Desc, Amount) hash.
        
        # Let's assume for this redesign we generate a hash for matching if ID is missing
        df['hash'] = df.apply(lambda x: f"{x['Transaction Date']}_{x['Description']}_{x['Amount']}", axis=1)
        
        # Apply overrides based on hash (or ID if we had one persistent)
        # In the current "Overrides" model, we store overrides by this hash
        
        for idx, row in df.iterrows():
            tx_hash = row['hash']
            if tx_hash in overrides:
                changes = overrides[tx_hash]
                for col, val in changes.items():
                    if col in df.columns:
                        df.at[idx, col] = val
        
        # Drop hash column
        df = df.drop(columns=['hash'])
        
        path = self.gold_dir / filename
        df.to_csv(path, index=False)
        print(f"Saved Gold data to {path}")
        return path

    def update_override(self, transaction: Dict[str, Any], updates: Dict[str, Any]):
        """
        Update an override for a specific transaction.
        transaction dict must contain: 'Transaction Date', 'Description', 'Amount'
        """
        overrides = self.load_overrides()
        tx_hash = f"{transaction['Transaction Date']}_{transaction['Description']}_{transaction['Amount']}"
        
        if tx_hash not in overrides:
            overrides[tx_hash] = {}
            
        overrides[tx_hash].update(updates)
        self.save_overrides(overrides)
        print(f"Updated override for {tx_hash}: {updates}")

    def bulk_update_overrides(self, updates_list: List[Dict[str, Any]]):
        """
        Update overrides for multiple transactions.
        updates_list: List of dicts, each containing 'transaction' (dict) and 'updates' (dict).
        """
        overrides = self.load_overrides()
        count = 0
        
        for item in updates_list:
            transaction = item['transaction']
            changes = item['updates']
            
            tx_hash = f"{transaction['Transaction Date']}_{transaction['Description']}_{transaction['Amount']}"
            
            if tx_hash not in overrides:
                overrides[tx_hash] = {}
                
            overrides[tx_hash].update(changes)
            count += 1
            
        self.save_overrides(overrides)
        print(f"Bulk updated {count} overrides")

