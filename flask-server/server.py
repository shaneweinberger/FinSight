from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
from werkzeug.utils import secure_filename
import subprocess

app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv'}

# Create uploads directory if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Endpoint to handle CSV file uploads. Validates and saves the file, then triggers ETL processing.
@app.route('/upload-csv', methods=['POST'])
def upload_csv():
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Check if file was selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only CSV files are allowed'}), 400
        
        # Secure the filename and save the file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Read and validate CSV file
        try:
            df = pd.read_csv(filepath)
            row_count = len(df)
            column_count = len(df.columns)

            # Trigger ETL script after successful upload and validation
            etl_script = os.path.join(os.path.dirname(__file__), 'bronze', 'initial_cleaning_etl.py')
            subprocess.Popen(['python', etl_script])
            
            return jsonify({
                'message': 'File uploaded successfully',
                'filename': filename,
                'rows': row_count,
                'columns': column_count,
                'columns_list': df.columns.tolist()
            })
        except Exception as e:
            # If CSV is invalid, delete the file and return error
            os.remove(filepath)
            return jsonify({'error': f'Invalid CSV file: {str(e)}'}), 400
            
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

# Endpoint to return cleaned transaction data as JSON for the frontend.
@app.route('/transactions', methods=['GET'])
def transactions():
    try:
        # Path to the cleaned CSV in gold
        cleaned_csv_path = os.path.join(os.path.dirname(__file__), 'gold', 'cleaned_transactions.csv')
        if not os.path.exists(cleaned_csv_path):
            return jsonify({'error': 'No cleaned transactions file found'}), 404
        # Read the cleaned CSV file
        df = pd.read_csv(cleaned_csv_path)
        # Replace NaN with None (which becomes null in JSON)
        df = df.where(pd.notnull(df), None)
        # Convert to list of dicts
        transactions = df.to_dict(orient='records')
        return jsonify({'transactions': transactions})
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)