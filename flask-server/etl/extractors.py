"""
Extractors for reading raw transaction data from CSV files.
"""
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
import os

class BaseExtractor(ABC):
    """Base class for all extractors."""
    
    @abstractmethod
    def extract(self, file_path: Path) -> pd.DataFrame:
        """Extract data from a file and return a standardized DataFrame."""
        pass

class CreditExtractor(BaseExtractor):
    """Extractor for credit card transactions."""
    
    def extract(self, file_path: Path) -> pd.DataFrame:
        print(f"Extracting credit data from {file_path}")
        
        try:
            # Try reading with headers first
            df = pd.read_csv(file_path)
            
            # Check for headerless format (5 columns, first looks like date)
            # Typical format: Date, Description, Debit, Credit, Balance
            if len(df.columns) == 5 and 'Transaction Date' not in df.columns:
                # Re-read without header
                df = pd.read_csv(file_path, header=None)
                df.columns = ['Transaction Date', 'Description', 'Debit', 'Credit', 'Balance']
                
                # Process amounts
                # Debit is positive expense, Credit is negative expense (payment)
                # We want Amount to be positive for expense, negative for income/payment?
                # Wait, usually in this app:
                # Expenses are positive? Let's check debit extractor.
                # DebitExtractor: Amount = Outflow - Inflow. So Outflow (expense) is positive.
                
                df['Debit'] = pd.to_numeric(df['Debit'], errors='coerce').fillna(0)
                df['Credit'] = pd.to_numeric(df['Credit'], errors='coerce').fillna(0)
                
                # For credit cards:
                # Debit column = Purchase (Expense) -> Should be Positive
                # Credit column = Payment (Income) -> Should be Negative
                df['Amount'] = df['Debit'] - df['Credit']
                
                # Convert date
                # Input format seems to be MM/DD/YYYY based on "10/18/2025"
                df['Transaction Date'] = pd.to_datetime(df['Transaction Date']).dt.strftime('%m/%d/%Y')
                
                return df[['Transaction Date', 'Description', 'Amount']]

            # Handle different column names if necessary for files WITH headers
            if 'Transaction Date' not in df.columns and 'Date' in df.columns:
                df['Transaction Date'] = df['Date']
                
            # Ensure required columns exist
            required_cols = ['Transaction Date', 'Description', 'Amount']
            for col in required_cols:
                if col not in df.columns:
                    raise ValueError(f"Missing required column: {col} in {file_path}")
                    
            return df[required_cols]
            
        except Exception as e:
            print(f"Error extracting credit file {file_path}: {e}")
            raise

class DebitExtractor(BaseExtractor):
    """Extractor for debit card transactions."""
    
    def extract(self, file_path: Path) -> pd.DataFrame:
        print(f"Extracting debit data from {file_path}")
        
        # Check for TD format (no headers, 5 columns)
        try:
            # Try reading with headers first
            df = pd.read_csv(file_path)
            
            # Heuristic for TD format: 5 columns, first looks like a date
            if len(df.columns) == 5 and 'Transaction Date' not in df.columns:
                 # Re-read without header
                df = pd.read_csv(file_path, header=None)
                df.columns = ['Transaction Date', 'Description', 'Outflow', 'Inflow', 'Balance']
                
                # Process amounts
                df['Outflow'] = pd.to_numeric(df['Outflow'], errors='coerce').fillna(0)
                df['Inflow'] = pd.to_numeric(df['Inflow'], errors='coerce').fillna(0)
                df['Amount'] = df['Outflow'] - df['Inflow']
                
                # Convert date
                df['Transaction Date'] = pd.to_datetime(df['Transaction Date']).dt.strftime('%m/%d/%Y')
                
                return df[['Transaction Date', 'Description', 'Amount']]
            
            # Regular CSV with headers
            if 'Details' in df.columns:
                 df = df.rename(columns={"Details": "Transaction Date", "Posting Date": "Description"})
            
            # Ensure required columns exist
            required_cols = ['Transaction Date', 'Description', 'Amount']
            for col in required_cols:
                if col not in df.columns:
                    # Try to map common names
                    if 'Date' in df.columns: df['Transaction Date'] = df['Date']
                    if 'Memo' in df.columns: df['Description'] = df['Memo']
                    if 'Value' in df.columns: df['Amount'] = df['Value']
            
            return df[required_cols]
            
        except Exception as e:
            print(f"Error extracting debit file {file_path}: {e}")
            raise
