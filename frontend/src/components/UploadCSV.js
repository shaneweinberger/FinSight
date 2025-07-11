import React, { useRef } from 'react';

const UploadCSV = ({ onFileUpload }) => {
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button onClick={() => fileInputRef.current.click()}>
        Upload Transactions CSV
      </button>
    </div>
  );
};

export default UploadCSV; 