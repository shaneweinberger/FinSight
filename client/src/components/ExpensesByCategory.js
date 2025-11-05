import React from 'react';

const ExpensesByCategory = ({ transactions, startDate, endDate, selectedCategory, onCategorySelect }) => {
  // Filter for expenses in the date range
  const filtered = React.useMemo(() => {
    if (!startDate || !endDate || !transactions.length) return [];
    return transactions.filter(tx => {
      const txDate = new Date(tx['Transaction Date']);
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59'); // End of day to include all transactions
      return txDate >= start && txDate <= end;
    });
  }, [transactions, startDate, endDate]);

  // Group by category - simple sum of all amounts by category
  const categoryStats = React.useMemo(() => {
    const stats = {};
    const DEBUG = true; // Set to true to enable debug logging
    
    // Sum amounts by category (including sign)
    filtered.forEach(tx => {
      const cat = tx.Category;
      const amt = parseFloat(tx.Amount) || 0;
      
      if (!stats[cat]) {
        stats[cat] = { count: 0, total: 0 };
      }
      
      stats[cat].count += 1;
      stats[cat].total += amt; // Sum includes sign (negative reduces total)
      
      // Debug Food & Drink only
      if (DEBUG && cat === 'Food & Drink') {
        console.log('Food & Drink:', tx.Description, '=', amt, '| Running total:', stats[cat].total);
      }

      // Debug Uncategorized only
      if (DEBUG && cat === 'Uncategorized') {
        console.log('Uncategorized:', tx.Description, '=', amt, '| Running total:', stats[cat].total);
      }
    });
    
    if (DEBUG && stats['Food & Drink']) {
      console.log('FINAL Food & Drink total:', stats['Food & Drink'].total);
    }

    if (DEBUG && stats['Uncategorized']) {
      console.log('FINAL Uncategorized total:', stats['Uncategorized'].total);
    }
    
    return { stats, total: 0 };
  }, [filtered]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const categories = Object.keys(categoryStats.stats || {});
  // Calculate percentages based on absolute totals
  let totalAbsolute = 0;
  categories.forEach(cat => {
    totalAbsolute += Math.abs(categoryStats.stats[cat].total);
  });
  categories.forEach(cat => {
    categoryStats.stats[cat].percent = totalAbsolute > 0 
      ? (Math.abs(categoryStats.stats[cat].total) / totalAbsolute) * 100 
      : 0;
  });
  const sortedCategories = categories.sort((a, b) => (categoryStats.stats[b].percent - categoryStats.stats[a].percent));

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
            {sortedCategories.map(cat => {
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