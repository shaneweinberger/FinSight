import React from 'react';

const ExpensesByCategory = ({ transactions, startDate, endDate, selectedCategory, onCategorySelect }) => {
  // Filter for expenses in the date range
  const filtered = React.useMemo(() => {
    if (!startDate || !endDate || !transactions.length) return [];
    return transactions.filter(tx => {
      if (tx.Type !== 'Debit') return false;
      const txDate = new Date(tx['Transaction Date']);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return txDate >= start && txDate <= end;
    });
  }, [transactions, startDate, endDate]);

  // Group by category
  const categoryStats = React.useMemo(() => {
    const stats = {};
    let total = 0;
    filtered.forEach(tx => {
      const cat = tx.Category || 'Uncategorized';
      const amt = Math.abs(parseFloat(tx.Amount));
      if (!stats[cat]) stats[cat] = { count: 0, total: 0 };
      stats[cat].count += 1;
      stats[cat].total += amt;
      total += amt;
    });
    // Calculate percent
    Object.keys(stats).forEach(cat => {
      stats[cat].percent = total > 0 ? (stats[cat].total / total) * 100 : 0;
    });
    return { stats, total };
  }, [filtered]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const categories = Object.keys(categoryStats.stats || {});

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-6 max-w-1/2 w-1/2 self-start">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Expenses by Category</h3>
      {categories.length === 0 ? (
        <div className="text-gray-500 text-sm">No expenses for this period.</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th style={{ width: '20px' }} className="py-2 px-2 text-left font-semibold">Category</th>
              <th style={{ width: '20px' }} className="py-2 px-2 text-right font-semibold"># Expenses</th>
              <th style={{ width: '20px' }} className="py-2 px-2 text-right font-semibold">Total Spent</th>
              <th style={{ width: '20px' }} className="py-2 px-2 text-right font-semibold">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              const isDimmed = selectedCategory && !isSelected;
              return (
                <tr
                  key={cat}
                  className={`border-b last:border-b-0 cursor-pointer transition ${isSelected ? 'font-bold bg-blue-50' : ''} ${isDimmed ? 'text-gray-400 bg-gray-50' : ''}`}
                  onClick={() => onCategorySelect(isSelected ? null : cat)}
                >
                  <td className="py-2 px-2 align-top">{cat}</td>
                  <td className="py-2 px-2 text-right">{categoryStats.stats[cat].count}</td>
                  <td className="py-2 px-2 text-right">{formatCurrency(categoryStats.stats[cat].total)}</td>
                  <td className="py-2 px-2 text-right">{categoryStats.stats[cat].percent.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExpensesByCategory; 