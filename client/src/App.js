import React, { useState, useRef, useEffect } from 'react';
import Overview from './components/Overview';
import MonthlyAnalysis from './components/MonthlyAnalysis';

const sidebarLinks = [
  { label: 'Overview', icon: '📊' },
  { label: 'Analysis', icon: '📈' }
];

export default function App() {
  const [csvFile, setCsvFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef();
  const [transactions, setTransactions] = useState([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    fetch('http://192.168.4.22:8000/transactions')
      .then(res => res.json())
      .then(data => {
        if (data.transactions) setTransactions(data.transactions);
      });
  }, []);

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
    setUploadStatus('');
  };

  const handleUpload = async () => {
    if (!csvFile) {
      setUploadStatus('Please select a CSV file.');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      const response = await fetch('http://192.168.4.22:8000/upload-csv', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setUploadStatus('Upload successful!');
        setCsvFile(null);
      } else {
        setUploadStatus(data.error || 'Upload failed.');
      }
    } catch (err) {
      setUploadStatus('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between py-6 px-4">
        <div>
          <nav className="space-y-1">
            {sidebarLinks.map((item, idx) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition text-gray-700 hover:bg-gray-100 ${activeTab === item.label ? 'bg-gray-100 font-semibold' : ''}`}
                onClick={() => setActiveTab(item.label)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <input
              className="rounded-lg px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              placeholder="Search..."
            />
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="ml-2 px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition"
              disabled={isUploading}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              Select CSV
            </button>
            <button
              type="button"
              className="ml-2 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition"
              disabled={!csvFile || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? 'Uploading...' : 'Upload CSV'}
            </button>
            {uploadStatus && (
              <span className={`ml-2 text-xs ${uploadStatus.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{uploadStatus}</span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-700">SW</div>
            <div className="text-right">
              <div className="font-semibold text-gray-800">Shane W.</div>
            </div>
          </div>
        </div>
        
        {activeTab === 'Overview' && <Overview transactions={transactions} />}
        {activeTab === 'Analysis' && <MonthlyAnalysis transactions={transactions} />}
      </main>
    </div>
  );
}