"""
Transaction data model.
"""
from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class Transaction:
    """Represents a financial transaction."""
    transaction_date: str
    description: str
    category: str
    amount: float
    
    def __post_init__(self):
        """Validate and clean data after initialization."""
        # Ensure amount is a float
        if isinstance(self.amount, str):
            try:
                self.amount = float(self.amount)
            except ValueError:
                self.amount = 0.0
        
        # Clean category
        if not self.category or self.category.strip() == '':
            self.category = 'Uncategorized'
    
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
            'Amount': self.amount
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Transaction':
        """Create Transaction from dictionary."""
        return cls(
            transaction_date=data.get('Transaction Date', ''),
            description=data.get('Description', ''),
            category=data.get('Category', ''),
            amount=data.get('Amount', 0.0)
        )
