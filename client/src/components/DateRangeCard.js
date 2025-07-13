import React, { useState, useEffect } from 'react';

const DateRangeCard = ({ transactions }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [totals, setTotals] = useState({
    income: 0,
    expenses: 0,
    net: 0,
    count: 0
  });

  // Set default date range to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Filter transactions based on date range
  useEffect(() => {
    if (!startDate || !endDate || !transactions.length) return;

    const filtered = transactions.filter(tx => {
      const txDate = new Date(tx['Transaction Date']);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return txDate >= start && txDate <= end;
    });

    setFilteredTransactions(filtered);

    // Calculate totals
    const income = filtered
      .filter(tx => tx.Type === 'Credit')
      .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.Amount)), 0);

    const expenses = filtered
      .filter(tx => tx.Type === 'Debit')
      .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.Amount)), 0);

    setTotals({
      income: income,
      expenses: expenses,
      net: income - expenses,
      count: filtered.length
    });
  }, [startDate, endDate, transactions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Date Range Summary</h3>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.income)}</div>
          <div className="text-sm text-gray-500">Total Income</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.expenses)}</div>
          <div className="text-sm text-gray-500">Total Expenses</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totals.net)}
          </div>
          <div className="text-sm text-gray-500">Net Amount</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totals.count}</div>
          <div className="text-sm text-gray-500">Transactions</div>
        </div>
      </div>
    </div>
  );
};

export default DateRangeCard; 