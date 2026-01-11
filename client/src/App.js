import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import AuthPage from './pages/AuthPage';
import { authenticatedFetch } from './utils/api';

import Overview from './components/Overview';
import MonthlyAnalysis from './components/MonthlyAnalysis';
import TransactionUploads from './components/TransactionUploads';
import Categories from './components/Categories';
import Rules from './components/Rules';

const sidebarLinks = [
  { label: 'Overview', icon: '📊', path: '/' },
  { label: 'Analysis', icon: '📈', path: '/analysis' },
  { label: 'Uploads', icon: '📁', path: '/uploads' },
  { label: 'Categories', icon: '🏷️', path: '/categories' },
  { label: 'Rules', icon: '📝', path: '/rules' }
];

const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  // Update active tab based on path
  useEffect(() => {
    const currentPath = location.pathname;
    const link = sidebarLinks.find(l => l.path === currentPath);
    if (link) setActiveTab(link.label);
    else if (currentPath === '/') setActiveTab('Overview');
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between py-6 px-4">
        <div>
          <div className="mb-8 px-3">
            <h1 className="text-2xl font-bold text-blue-600">FinSight</h1>
          </div>
          <nav className="space-y-1">
            {sidebarLinks.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === item.label
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
                onClick={() => navigate(item.path)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-gray-200 pt-4 px-3">
          <button
            onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {/* Search or breadcrumbs */}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold text-gray-800">{user?.email}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600 shadow-sm">
              {user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </div>

        <Routes>
          <Route path="/" element={<DashboardView view="Overview" />} />
          <Route path="/analysis" element={<DashboardView view="Analysis" />} />
          <Route path="/uploads" element={<DashboardView view="Uploads" />} />
          <Route path="/categories" element={<DashboardView view="Categories" />} />
          <Route path="/rules" element={<DashboardView view="Rules" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const DashboardView = ({ view }) => {
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/transactions');
      if (response.ok) {
        const data = await response.json();
        if (data.transactions) {
          setTransactions(data.transactions);
        }
      } else {
        console.error("Failed to fetch transactions");
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [view]); // Fetch when view changes or initially

  const handleReprocess = () => {
    setTimeout(fetchTransactions, 2000);
  };

  if (view === 'Overview') return <Overview transactions={transactions} />;
  if (view === 'Analysis') return <MonthlyAnalysis transactions={transactions} onRefresh={fetchTransactions} />;
  if (view === 'Uploads') return <TransactionUploads onReprocess={handleReprocess} />;
  if (view === 'Categories') return <Categories />;
  if (view === 'Rules') return <Rules />;
  return null;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}