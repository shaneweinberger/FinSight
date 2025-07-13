import React, { useState, useRef, useEffect } from 'react';
import SummaryCards from './components/SummaryCards';
import { summaryCards } from './data/summaryCards';

const sidebarLinks = [
  { label: 'Overview', icon: '📊' }
];

const columns = [
  { key: 'Transaction Date', label: 'Transaction Date' },
  { key: 'Description', label: 'Description' },
  { key: 'Category', label: 'Category' },
  { key: 'Type', label: 'Type' },
  { key: 'Amount', label: 'Amount' }
];

export default function App() {
  const [csvFile, setCsvFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef();
  const [transactions, setTransactions] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

  // Pagination calculations
  const totalPages = Math.ceil(transactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between py-6 px-4">
        <div>
          <nav className="space-y-1">
            {sidebarLinks.map((item, idx) => (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition text-gray-700 hover:bg-gray-100 bg-gray-100 font-semibold"
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
        <SummaryCards cards={summaryCards} />
        <div className="flex justify-between items-center mb-2">
          <div className="text-lg font-bold">Product Analytics</div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm">Customize</button>
            <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm">Filter</button>
            <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm">Export</button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="py-3 px-4 text-left font-semibold">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((tx, idx) => (
                <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                  {columns.map(col => (
                    <td key={col.key} className="py-3 px-4">{tx[col.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div>
              Showing {startIndex + 1} to {Math.min(endIndex, transactions.length)} of {transactions.length} transactions
            </div>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select 
                value={pageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Next
            </button>
          </div>
          <div>
            Page {currentPage} of {totalPages}
          </div>
        </div>
      </main>
    </div>
  );
}