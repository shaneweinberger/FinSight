import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [data, setData] = useState([{}]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetch("/members")
    .then(response => response.json())
    .then(data => {setData(data); console.log(data)})
    
    // Load uploaded files
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      const response = await fetch('/uploaded-files');
      const data = await response.json();
      if (data.files) {
        setUploadedFiles(data.files);
      }
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setUploadStatus('');
    } else if (file) {
      setUploadStatus('Please select a CSV file');
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadStatus(`✅ ${result.message} - ${result.rows} rows, ${result.columns} columns`);
        setSelectedFile(null);
        // Refresh the uploaded files list
        fetchUploadedFiles();
      } else {
        setUploadStatus(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus(`❌ Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>CSV File Upload</h1>
      </header>
      
      <main className="App-main">
        <div className="upload-section">
          <h2>Upload CSV File</h2>
          
          <div className="file-input-container">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="file-input"
              id="file-input"
            />
            <label htmlFor="file-input" className="file-input-label">
              {selectedFile ? selectedFile.name : 'Choose CSV file'}
            </label>
          </div>

          {selectedFile && (
            <div className="file-info">
              <p>Selected file: {selectedFile.name}</p>
              <p>Size: {formatFileSize(selectedFile.size)}</p>
            </div>
          )}

          <button 
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="upload-button"
          >
            {isUploading ? 'Uploading...' : 'Upload CSV'}
          </button>

          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.includes('❌') ? 'error' : 'success'}`}>
              {uploadStatus}
            </div>
          )}
        </div>

        <div className="files-section">
          <h2>Uploaded Files</h2>
          {uploadedFiles.length === 0 ? (
            <p>No files uploaded yet</p>
          ) : (
            <ul className="files-list">
              {uploadedFiles.map((file, index) => (
                <li key={index} className="file-item">
                  <span className="file-name">{file.filename}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="members-section">
          <h2>API Test</h2>
          {typeof data.members === 'undefined' ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {data.members.map((member, i) => (
                <li key={i}>{member}</li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default App