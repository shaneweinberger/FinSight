import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, FolderInput, Tags, FileText, PieChart } from 'lucide-react';
import Overview from './components/Overview';
import MonthlyAnalysis from './components/MonthlyAnalysis';
import TransactionUploads from './components/TransactionUploads';
import Categories from './components/Categories';
import Rules from './components/Rules';
import ChatbotSidebar from './components/ChatbotSidebar';

const sidebarLinks = [
  { label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { label: 'Analysis', icon: <TrendingUp size={20} /> },
  { label: 'Transaction Uploads', icon: <FolderInput size={20} /> },
  { label: 'Categories', icon: <Tags size={20} /> },
  { label: 'Rules', icon: <FileText size={20} /> }
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
    <div className="h-screen overflow-hidden bg-gray-50 flex font-sans text-gray-900">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <PieChart size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">FinSight</h1>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {sidebarLinks.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 
                ${activeTab === item.label
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
              SW
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Shane W.</p>
              <p className="text-xs text-gray-500 truncate">Pro Account</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative w-full">
              <input
                className="w-full rounded-lg pl-10 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all"
                placeholder="Search transactions, categories..."
              />
              <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Top right actions could go here */}
          </div>
        </div>

        {activeTab === 'Overview' && <Overview transactions={transactions} />}
        {activeTab === 'Analysis' && <MonthlyAnalysis transactions={transactions} onRefresh={fetchTransactions} />}
        {activeTab === 'Transaction Uploads' && <TransactionUploads onReprocess={handleReprocess} />}
        {activeTab === 'Categories' && <Categories />}
        {activeTab === 'Rules' && <Rules />}
      </main>

      {/* Chatbot Sidebar - Only visible on Overview and Analysis */}
      {(activeTab === 'Overview' || activeTab === 'Analysis') && (
        <ChatbotSidebar />
      )}
    </div>
  );
}