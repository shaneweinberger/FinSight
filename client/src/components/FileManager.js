import React, { useState, useEffect } from 'react';

const FileManager = ({ uploadType, onReprocess }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/files/${uploadType}`);
      const data = await response.json();
      if (data.files) {
        setFiles(data.files);
      } else {
        setError(data.error || 'Failed to load files');
      }
    } catch (err) {
      setError('Failed to load files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [uploadType]);

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?\n\nNote: You'll need to click "Re-process All" after deleting to update transactions.`)) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/files/${uploadType}/${encodeURIComponent(filename)}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      
      if (response.ok) {
        fetchFiles(); // Refresh list
        alert('File deleted successfully');
      } else {
        alert(data.error || 'Failed to delete file');
      }
    } catch (err) {
      alert('Failed to delete file');
      console.error(err);
    }
  };

  const handleReprocess = async () => {
    if (!window.confirm(`Re-process all ${uploadType} files? This will clear and rebuild all transactions.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/reprocess/${uploadType}`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (response.ok) {
        alert('Re-processing complete! Refreshing transactions...');
        if (onReprocess) {
          onReprocess();
        }
      } else {
        alert(data.error || 'Failed to re-process files');
      }
    } catch (err) {
      alert('Failed to re-process files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {uploadType === 'credit' ? 'Credit' : 'Debit'} Files ({files.length})
        </h3>
        <button
          onClick={handleReprocess}
          disabled={loading || files.length === 0}
          className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Re-process All'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}

      {loading && files.length === 0 ? (
        <div className="text-gray-500 text-sm">Loading files...</div>
      ) : files.length === 0 ? (
        <div className="text-gray-500 text-sm">No files uploaded yet</div>
      ) : (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-800">{file.filename}</div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(file.size)} • {formatDate(file.uploaded)}
                </div>
              </div>
              <button
                onClick={() => handleDelete(file.filename)}
                className="ml-4 px-3 py-1 rounded bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileManager;

