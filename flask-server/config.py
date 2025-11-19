"""
Configuration management for the FinSight Flask application.
"""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent

# Data directories
DATA_DIR = BASE_DIR / "data"
BRONZE_DIR = DATA_DIR / "bronze"
SILVER_DIR = DATA_DIR / "silver"
GOLD_DIR = DATA_DIR / "gold"

CREDIT_UPLOADS_DIR = BRONZE_DIR / "credit"
DEBIT_UPLOADS_DIR = BRONZE_DIR / "debit"
UPLOADS_DIR = BASE_DIR / "uploads" # Keep this for temp uploads if needed, or deprecate

# File paths
CATEGORIES_FILE = GOLD_DIR / "categories.json"
CREDIT_CLEANED_FILE = SILVER_DIR / "credit_silver.csv" # Renamed from credit_cleaned.csv
DEBIT_CLEANED_FILE = SILVER_DIR / "debit_silver.csv"   # Renamed from debit_cleaned.csv
# MERGED_FILE is deprecated in new pipeline

# Updated files for editing functionality (The Source of Truth)
CREDIT_CLEANED_UPDATED_FILE = GOLD_DIR / "credit_cleaned_and_updated.csv"
DEBIT_CLEANED_UPDATED_FILE = GOLD_DIR / "debit_cleaned_and_updated.csv"
# MERGED_UPDATED_FILE is deprecated

# ETL Scripts (Deprecated, kept for reference until full cleanup)
CREDIT_ETL_SCRIPT = BASE_DIR / "bronze" / "initial_cleaning_credit_etl.py"
DEBIT_ETL_SCRIPT = BASE_DIR / "bronze" / "initial_cleaning_debit_etl.py"

# Flask configuration
UPLOAD_FOLDER = str(UPLOADS_DIR)
ALLOWED_EXTENSIONS = {'csv'}

# API Configuration
API_HOST = '0.0.0.0'
API_PORT = 8000
DEBUG = True

# Ensure directories exist
for directory in [DATA_DIR, BRONZE_DIR, SILVER_DIR, GOLD_DIR, CREDIT_UPLOADS_DIR, DEBIT_UPLOADS_DIR, UPLOADS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)
