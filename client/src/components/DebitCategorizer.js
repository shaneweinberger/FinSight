import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from '../utils/api';

const DebitCategorizer = ({ transactions, onCategorize }) => {
  const [categories, setCategories] = useState([]);
  const [uncategorizedTransactions, setUncategorizedTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch categories from backend
  useEffect(() => {
    authenticatedFetch('http://localhost:8000/categories')
      .then(res => res.json())
      .then(data => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  // Filter uncategorized transactions
  useEffect(() => {
    if (transactions) {
      const uncategorized = transactions.filter(tx =>
        !tx.Category || tx.Category === 'Uncategorized' || tx.Category === ''
      );
      setUncategorizedTransactions(uncategorized);
    }
  }, [transactions]);

  const handleCategorize = () => {
    if (selectedTransaction && selectedCategory) {
      onCategorize(selectedTransaction, selectedCategory);
      setSelectedTransaction(null);
      setSelectedCategory('');
    }
  };

  const handleTransactionSelect = (transaction) => {
    setSelectedTransaction(transaction);
    setSelectedCategory('');
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Categorize Debit Transactions</h3>

      {uncategorizedTransactions.length === 0 ? (
        <div className="text-gray-500 text-sm">No uncategorized transactions found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction List */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Uncategorized Transactions ({uncategorizedTransactions.length})</h4>
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              {uncategorizedTransactions.map((tx, idx) => (
                <div
                  key={idx}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedTransaction === tx ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  onClick={() => handleTransactionSelect(tx)}
                >
                  <div className="font-medium text-sm">{tx.Description}</div>
                  <div className="text-xs text-gray-500">
                    {tx['Transaction Date']} • ${Math.abs(parseFloat(tx.Amount)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Select Category</h4>
            {selectedTransaction ? (
              <div>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-sm">{selectedTransaction.Description}</div>
                  <div className="text-xs text-gray-500">
                    {selectedTransaction['Transaction Date']} • ${Math.abs(parseFloat(selectedTransaction.Amount)).toFixed(2)}
                  </div>
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Choose a category...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  onClick={handleCategorize}
                  disabled={!selectedCategory}
                  className="mt-3 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Assign Category
                </button>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Select a transaction to categorize</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebitCategorizer; 