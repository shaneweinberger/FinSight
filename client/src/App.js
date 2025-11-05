import React, { useState, useEffect } from 'react';
import Overview from './components/Overview';
import MonthlyAnalysis from './components/MonthlyAnalysis';
import TransactionUploads from './components/TransactionUploads';

const sidebarLinks = [
  { label: 'Overview', icon: '📊' },
  { label: 'Analysis', icon: '📈' },
  { label: 'Transaction Uploads', icon: '📁' }
];

export default function App() {
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

  const handleReprocess = async () => {
    // Refresh transactions after reprocessing
    setTimeout(() => {
      fetchTransactions();
    }, 5000); // Wait 5 seconds for reprocessing
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
        {activeTab === 'Transaction Uploads' && <TransactionUploads onReprocess={handleReprocess} />}
      </main>
    </div>
  );
}