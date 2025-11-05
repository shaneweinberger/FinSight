"""
Transaction data model.
"""
from dataclasses import dataclass
from typing import Optional
from datetime import datetime
import uuid


@dataclass
class Transaction:
    """Represents a financial transaction."""
    transaction_date: str
    description: str
    category: str
    amount: float
    transaction_id: Optional[str] = None  # Unique identifier for this transaction
    
    def __post_init__(self):
        """Validate and clean data after initialization."""
        # Handle None, empty string, or NaN amounts
        if self.amount is None:
            self.amount = 0.0
        elif isinstance(self.amount, str):
            if self.amount.strip() == '':
                self.amount = 0.0
            else:
                try:
                    self.amount = float(self.amount)
                except ValueError:
                    self.amount = 0.0
        # Handle pandas NaN
        try:
            import pandas as pd
            if pd.isna(self.amount):
                self.amount = 0.0
        except (ImportError, TypeError):
            pass
        
        # Clean category
        if not self.category or self.category.strip() == '':
            self.category = 'Uncategorized'
        
        # Generate ID if not provided
        if not self.transaction_id:
            self.transaction_id = str(uuid.uuid4())
    
    @property
    def is_credit(self) -> bool:
        """Check if this is a credit transaction (positive amount)."""
        return self.amount > 0
    
    @property
    def is_debit(self) -> bool:
        """Check if this is a debit transaction (negative amount)."""
        return self.amount < 0
    
    def to_dict(self) -> dict:
        """Convert transaction to dictionary for JSON serialization."""
        return {
            'Transaction Date': self.transaction_date,
            'Description': self.description,
            'Category': self.category,
            'Amount': self.amount,
            'Transaction ID': self.transaction_id
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Transaction':
        """Create Transaction from dictionary."""
        # Get transaction_id and handle empty strings/None
        tx_id = data.get('Transaction ID') or data.get('transaction_id')
        if tx_id and isinstance(tx_id, str) and tx_id.strip() == '':
            tx_id = None
        
        return cls(
            transaction_date=data.get('Transaction Date', ''),
            description=data.get('Description', ''),
            category=data.get('Category', ''),
            amount=data.get('Amount', 0.0),
            transaction_id=tx_id  # Will be None if missing, triggers UUID generation in __post_init__
        )
