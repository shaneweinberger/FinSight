# FinSight Backend

A clean, well-structured Flask backend for financial transaction analysis.

## Architecture

### Directory Structure
```
flask-server/
├── app.py                 # Main Flask application
├── server.py             # Legacy entry point (redirects to app.py)
├── config.py             # Configuration management
├── models/               # Data models
│   ├── __init__.py
│   └── transaction.py    # Transaction data model
├── services/             # Business logic layer
│   ├── __init__.py
│   ├── transaction_service.py  # Transaction operations
│   └── upload_service.py       # File upload operations
├── utils/                # Utility functions
│   ├── __init__.py
│   └── json_utils.py     # JSON serialization utilities
├── bronze/               # ETL scripts (Bronze layer)
│   ├── initial_cleaning_credit_etl.py
│   └── initial_cleaning_debit_etl.py
├── gold/                 # Cleaned data (Gold layer)
│   ├── credit_cleaned.csv
│   ├── debit_cleaned.csv
│   └── categories.json
├── credit_uploads/       # Raw credit card data
├── debit_uploads/        # Raw debit card data
└── requirements.txt      # Python dependencies
```

## Design Principles

### 1. Separation of Concerns
- **Models**: Data structures and validation
- **Services**: Business logic and data operations
- **Utils**: Reusable utility functions
- **Config**: Centralized configuration management

### 2. Clean Architecture
- **Presentation Layer**: Flask routes (`app.py`)
- **Business Layer**: Services (`services/`)
- **Data Layer**: Models (`models/`) and file operations

### 3. Data Pipeline (Bronze → Gold)
- **Bronze Layer**: Raw data processing and cleaning
- **Gold Layer**: Cleaned, categorized, and ready-to-use data

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /transactions` - Get all transactions
- `GET /categories` - Get available categories
- `GET /stats` - Get transaction statistics
- `POST /upload-csv` - Upload and process CSV files

## Usage

### Running the Server
```bash
# Using the new structure
python3 app.py

# Using legacy entry point
python3 server.py
```

### Environment Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create .env file with GEMINI_API_KEY
```

## Data Flow

1. **Upload**: CSV files uploaded to `credit_uploads/` or `debit_uploads/`
2. **Processing**: ETL scripts in `bronze/` clean and categorize data
3. **Storage**: Cleaned data stored in `gold/` directory
4. **API**: Services provide clean data to frontend via REST API

## Key Features

- ✅ **Clean Architecture**: Proper separation of concerns
- ✅ **Type Safety**: Data models with validation
- ✅ **Error Handling**: Comprehensive error management
- ✅ **JSON Safety**: Proper NaN handling for JSON serialization
- ✅ **Modular Design**: Easy to extend and maintain
- ✅ **Backward Compatibility**: Legacy `server.py` still works
