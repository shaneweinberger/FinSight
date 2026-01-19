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
            
            # Handle different column names if necessary for files WITH headers
            if 'Transaction Date' not in df.columns and 'Date' in df.columns:
                df['Transaction Date'] = df['Date']
            
            # Map Charge -> Debit
            if 'Charge' in df.columns and 'Debit' not in df.columns:
                df['Debit'] = df['Charge']
            
            # Check for headerless format (5 columns, first looks like date)
            # Typical format: Date, Description, Debit, Credit, Balance
            # Only assume headerless if we STILL have no Transaction Date
            if len(df.columns) == 5 and 'Transaction Date' not in df.columns:
                # Re-read without header
                df_headerless = pd.read_csv(file_path, header=None)
                df_headerless.columns = ['Transaction Date', 'Description', 'Debit', 'Credit', 'Balance']
                
                # Verify it's actually data and not just a header row read as data
                # If the first value is "Date", then it was actually a header file that we failed to parse above?
                # No, if it was "Date", pd.read_csv would have made it a column "Date".
                # But wait, if the file has 5 columns: Date, Description, Debit, Credit, Balance
                # pd.read_csv would give columns=['Date', 'Description', ...]
                # So we would have caught it in the "Date" check above.
                
                # So this block is truly for files WITHOUT headers.
                
                # Process amounts
                df_headerless['Debit'] = pd.to_numeric(df_headerless['Debit'], errors='coerce').fillna(0)
                df_headerless['Credit'] = pd.to_numeric(df_headerless['Credit'], errors='coerce').fillna(0)
                df_headerless['Amount'] = df_headerless['Debit'] - df_headerless['Credit']
                
                # Convert date
                # Drop rows where Date is invalid (e.g. if it accidentally read a header)
                df_headerless['Transaction Date'] = pd.to_datetime(df_headerless['Transaction Date'], errors='coerce')
                df_headerless = df_headerless.dropna(subset=['Transaction Date'])
                df_headerless['Transaction Date'] = df_headerless['Transaction Date'].dt.strftime('%m/%d/%Y')
                
                return df_headerless[['Transaction Date', 'Description', 'Amount']]

            # Calculate Amount if missing but Debit/Credit exist
            if 'Amount' not in df.columns and 'Debit' in df.columns and 'Credit' in df.columns:
                df['Debit'] = pd.to_numeric(df['Debit'], errors='coerce').fillna(0)
                df['Credit'] = pd.to_numeric(df['Credit'], errors='coerce').fillna(0)
                df['Amount'] = df['Debit'] - df['Credit']
            
            # Ensure required columns exist
            required_cols = ['Transaction Date', 'Description', 'Amount']
            for col in required_cols:
                if col not in df.columns:
                    raise ValueError(f"Missing required column: {col} in {file_path}")
                    
            # Normalize date format for standard CSVs too
            df['Transaction Date'] = pd.to_datetime(df['Transaction Date']).dt.strftime('%m/%d/%Y')
            
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
            
            # Calculate Amount from Debit/Credit if missing
            if 'Amount' not in df.columns and 'Debit' in df.columns and 'Credit' in df.columns:
                df['Debit'] = pd.to_numeric(df['Debit'], errors='coerce').fillna(0)
                df['Credit'] = pd.to_numeric(df['Credit'], errors='coerce').fillna(0)
                # For debit accounts: Debit is Outflow (expense), Credit is Inflow (income)
                # Amount = Outflow - Inflow
                df['Amount'] = df['Debit'] - df['Credit']
            
            return df[required_cols]
            
        except Exception as e:
            print(f"Error extracting debit file {file_path}: {e}")
            raise
