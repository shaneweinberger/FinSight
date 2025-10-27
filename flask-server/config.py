"""
Configuration management for the FinSight Flask application.
"""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent

# Data directories
BRONZE_DIR = BASE_DIR / "bronze"
GOLD_DIR = BASE_DIR / "gold"
CREDIT_UPLOADS_DIR = BASE_DIR / "credit_uploads"
DEBIT_UPLOADS_DIR = BASE_DIR / "debit_uploads"
UPLOADS_DIR = BASE_DIR / "uploads"

# File paths
CATEGORIES_FILE = GOLD_DIR / "categories.json"
CREDIT_CLEANED_FILE = GOLD_DIR / "credit_cleaned.csv"
DEBIT_CLEANED_FILE = GOLD_DIR / "debit_cleaned.csv"
MERGED_FILE = GOLD_DIR / "debit_credit_merge_etl.csv"

# Updated files for editing functionality
CREDIT_CLEANED_UPDATED_FILE = GOLD_DIR / "credit_cleaned_and_updated.csv"
DEBIT_CLEANED_UPDATED_FILE = GOLD_DIR / "debit_cleaned_and_updated.csv"
MERGED_UPDATED_FILE = GOLD_DIR / "debit_credit_merge_etl_and_updated.csv"

# ETL Scripts
CREDIT_ETL_SCRIPT = BRONZE_DIR / "initial_cleaning_credit_etl.py"
DEBIT_ETL_SCRIPT = BRONZE_DIR / "initial_cleaning_debit_etl.py"

# Flask configuration
UPLOAD_FOLDER = str(UPLOADS_DIR)
ALLOWED_EXTENSIONS = {'csv'}

# API Configuration
API_HOST = '0.0.0.0'
API_PORT = 8000
DEBUG = True

# Ensure directories exist
for directory in [BRONZE_DIR, GOLD_DIR, CREDIT_UPLOADS_DIR, DEBIT_UPLOADS_DIR, UPLOADS_DIR]:
    directory.mkdir(exist_ok=True)
