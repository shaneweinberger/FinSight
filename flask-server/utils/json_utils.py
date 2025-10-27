"""
JSON utility functions.
"""
import pandas as pd
from typing import Any, Dict, List


def clean_for_json(data: Any) -> Any:
    """
    Clean data for JSON serialization by replacing NaN values with None.
    
    Args:
        data: Data to clean (can be dict, list, or other types)
        
    Returns:
        Cleaned data safe for JSON serialization
    """
    if isinstance(data, dict):
        return {key: clean_for_json(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [clean_for_json(item) for item in data]
    elif pd.isna(data):
        return None
    else:
        return data


def transactions_to_json(transactions: List[Any]) -> List[Dict[str, Any]]:
    """
    Convert list of transactions to JSON-serializable format.
    
    Args:
        transactions: List of Transaction objects or dictionaries
        
    Returns:
        List of dictionaries ready for JSON serialization
    """
    result = []
    
    for transaction in transactions:
        if hasattr(transaction, 'to_dict'):
            # Transaction object
            tx_dict = transaction.to_dict()
        else:
            # Already a dictionary
            tx_dict = transaction
        
        # Clean for JSON
        clean_dict = clean_for_json(tx_dict)
        result.append(clean_dict)
    
    return result
