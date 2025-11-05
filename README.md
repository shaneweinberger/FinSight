# FINSIGHT - AI Personal Financial Analytics 

A simple web application that allows users to upload CSV files through a React frontend to a Flask backend.

## Features

- ✅ Modern, responsive UI with drag-and-drop file selection
- ✅ CSV file validation and preview
- ✅ File upload with progress feedback
- ✅ List of uploaded files with file sizes
- ✅ Secure file handling with proper error handling

## Setup Instructions

### Backend Setup (Flask)

1. Navigate to the Flask server directory:
   ```bash
   cd flask-server
   ```

2. Create a virtual environment (if not already created):
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run the Flask server:
   ```bash
   python server.py
   ```

The backend will run on `http://localhost:8000`

### Frontend Setup (React)

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Click "Choose CSV file" to select a CSV file
3. Click "Upload CSV" to upload the file
4. View uploaded files in the "Uploaded Files" section
5. The backend will validate the CSV and show row/column counts

## File Storage

Uploaded CSV files are stored in the `flask-server/uploads/` directory. The backend automatically creates this directory if it doesn't exist.

## API Endpoints

- `GET /members` - Test endpoint (existing)
- `POST /upload-csv` - Upload a CSV file
- `GET /uploaded-files` - Get list of uploaded files

## Error Handling

The application includes comprehensive error handling for:
- Invalid file types (non-CSV files)
- Corrupted or invalid CSV files
- Network errors
- Server errors

## Technologies Used

- **Backend**: Flask, Flask-CORS, Pandas
- **Frontend**: React, CSS3
- **File Handling**: Werkzeug secure_filename 
