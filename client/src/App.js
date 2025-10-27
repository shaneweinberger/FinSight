import React, { useState, useRef, useEffect } from 'react';
import Overview from './components/Overview';
import MonthlyAnalysis from './components/MonthlyAnalysis';

const sidebarLinks = [
  { label: 'Overview', icon: '📊' },
  { label: 'Analysis', icon: '📈' }
];

export default function App() {
  const [creditCsvFile, setCreditCsvFile] = useState(null);
  const [debitCsvFile, setDebitCsvFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const creditFileInputRef = useRef();
  const debitFileInputRef = useRef();
  const [transactions, setTransactions] = useState([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('Overview');

  const fetchTransactions = async () => {
    try {
      console.log('fetchTransactions called - fetching from API...');
      const response = await fetch('http://localhost:8000/transactions');
      const data = await response.json();
      console.log('Fetched data:', data);
      if (data.transactions) {
        console.log('Setting transactions:', data.transactions.length);
        setTransactions(data.transactions);
        console.log('Transactions updated in state');
      } else {
        console.log('No transactions in response');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

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
        setUploadStatus('Upload successful!');
        if (type === 'credit') setCreditCsvFile(null);
        if (type === 'debit') setDebitCsvFile(null);
      } else {
        setUploadStatus(data.error || 'Upload failed.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus(`Upload failed: ${err.message}`);
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
            {/* Credit Card Upload */}
            <input
              type="file"
              accept=".csv"
              ref={creditFileInputRef}
              className="hidden"
              onChange={handleCreditFileChange}
            />
            <button
              type="button"
              className="ml-2 px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition"
              disabled={isUploading}
              onClick={() => creditFileInputRef.current && creditFileInputRef.current.click()}
            >
              Select Credit Card CSV
            </button>
            <button
              type="button"
              className="ml-2 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition"
              disabled={!creditCsvFile || isUploading}
              onClick={() => handleUpload('credit')}
            >
              {isUploading && creditCsvFile ? 'Uploading...' : 'Upload Credit CSV'}
            </button>
            {/* Debit Card Upload */}
            <input
              type="file"
              accept=".csv"
              ref={debitFileInputRef}
              className="hidden"
              onChange={handleDebitFileChange}
            />
            <button
              type="button"
              className="ml-2 px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition"
              disabled={isUploading}
              onClick={() => debitFileInputRef.current && debitFileInputRef.current.click()}
            >
              Select Debit Card CSV
            </button>
            <button
              type="button"
              className="ml-2 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition"
              disabled={!debitCsvFile || isUploading}
              onClick={() => handleUpload('debit')}
            >
              {isUploading && debitCsvFile ? 'Uploading...' : 'Upload Debit CSV'}
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
        {activeTab === 'Analysis' && <MonthlyAnalysis transactions={transactions} onRefresh={fetchTransactions} />}
      </main>
    </div>
  );
}