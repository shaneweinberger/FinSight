import React, { useState, useEffect } from 'react';

const SummaryCard = ({ transactions, startDate, endDate }) => {
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [totals, setTotals] = useState({
    income: 0,
    expenses: 0,
    net: 0,
    count: 0
  });

  useEffect(() => {
    if (!startDate || !endDate || !transactions.length) return;

    const filtered = transactions.filter(tx => {
      const txDate = new Date(tx['Transaction Date']);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return txDate >= start && txDate <= end;
    });

    setFilteredTransactions(filtered);

    const income = filtered
      .filter(tx => parseFloat(tx.Amount) > 0)
      .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.Amount)), 0);

    const expenses = filtered
      .filter(tx => parseFloat(tx.Amount) < 0)
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
    <div className="bg-white rounded-xl shadow p-4 mb-6">
      <div className="flex items-center justify-center">
        <h3 className="text-lg font-semibold text-gray-800">Summary</h3>
      </div>
      <div className="flex flex-col items-center gap-6 mt-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.income)}</div>
          <div className="text-sm text-gray-500 mt-1">Total Income</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.expenses)}</div>
          <div className="text-sm text-gray-500 mt-1">Total Expenses</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totals.net)}</div>
          <div className="text-sm text-gray-500 mt-1">Net Amount</div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard; 