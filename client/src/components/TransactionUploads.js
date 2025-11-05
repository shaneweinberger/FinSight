import React, { useState, useRef } from 'react';
import FileManager from './FileManager';

const TransactionUploads = ({ onReprocess }) => {
  const [creditCsvFile, setCreditCsvFile] = useState(null);
  const [debitCsvFile, setDebitCsvFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const creditFileInputRef = useRef();
  const debitFileInputRef = useRef();

  const handleCreditFileChange = (e) => {
    setCreditCsvFile(e.target.files[0]);
    setUploadStatus('');
  };

  const handleDebitFileChange = (e) => {
    setDebitCsvFile(e.target.files[0]);
    setUploadStatus('');
  };

  const handleUpload = async (type) => {
    const file = type === 'credit' ? creditCsvFile : debitCsvFile;
    if (!file) {
      setUploadStatus('Please select a CSV file.');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    try {
      const response = await fetch('http://localhost:8000/upload-csv', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.message) {
        setUploadStatus(`${type === 'credit' ? 'Credit' : 'Debit'} upload successful! Processing...`);
        if (type === 'credit') setCreditCsvFile(null);
        if (type === 'debit') setDebitCsvFile(null);
        
        // Wait a moment for ETL to process
        setTimeout(() => {
          setUploadStatus(`${type === 'credit' ? 'Credit' : 'Debit'} upload and processing complete!`);
          if (onReprocess) {
            onReprocess();
          }
        }, 3000);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Transactions</h2>
        
        {/* Credit Card Upload Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Credit Card Transactions</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="file"
              accept=".csv"
              ref={creditFileInputRef}
              className="hidden"
              onChange={handleCreditFileChange}
            />
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition disabled:opacity-50"
              disabled={isUploading}
              onClick={() => creditFileInputRef.current && creditFileInputRef.current.click()}
            >
              Select Credit CSV
            </button>
            {creditCsvFile && (
              <span className="text-sm text-gray-600">{creditCsvFile.name}</span>
            )}
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50"
              disabled={!creditCsvFile || isUploading}
              onClick={() => handleUpload('credit')}
            >
              {isUploading && creditCsvFile ? 'Uploading...' : 'Upload Credit CSV'}
            </button>
          </div>
        </div>

        {/* Debit Card Upload Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Debit Card Transactions</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="file"
              accept=".csv"
              ref={debitFileInputRef}
              className="hidden"
              onChange={handleDebitFileChange}
            />
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition disabled:opacity-50"
              disabled={isUploading}
              onClick={() => debitFileInputRef.current && debitFileInputRef.current.click()}
            >
              Select Debit CSV
            </button>
            {debitCsvFile && (
              <span className="text-sm text-gray-600">{debitCsvFile.name}</span>
            )}
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50"
              disabled={!debitCsvFile || isUploading}
              onClick={() => handleUpload('debit')}
            >
              {isUploading && debitCsvFile ? 'Uploading...' : 'Upload Debit CSV'}
            </button>
          </div>
        </div>

        {uploadStatus && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            uploadStatus.includes('success') || uploadStatus.includes('complete') 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {uploadStatus}
          </div>
        )}
      </div>

      {/* File Management Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileManager 
          uploadType="credit" 
          onReprocess={onReprocess}
        />
        <FileManager 
          uploadType="debit" 
          onReprocess={onReprocess}
        />
      </div>
    </div>
  );
};

export default TransactionUploads;

