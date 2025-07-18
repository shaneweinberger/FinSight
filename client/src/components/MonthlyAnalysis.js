import React, { useState } from 'react';
import SummaryCard from './SummaryCard';
import TimeFilter from './TimeFilter';
import Pagination from './Pagination';
import ExpensesByCategory from './ExpensesByCategory';

const MonthlyAnalysis = ({ transactions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedCategory, setSelectedCategory] = useState(null);

  const columns = [
    { key: 'Transaction Date', label: 'Transaction Date' },
    { key: 'Description', label: 'Description' },
    { key: 'Category', label: 'Category' },
    { key: 'Amount', label: 'Amount' }
  ];

  // Update filtered transactions when props change
  React.useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  // Pagination calculations based on filtered transactions
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);
  const displayedTransactions = selectedCategory
    ? filteredTransactions.filter(tx => tx.Category === selectedCategory)
    : filteredTransactions;

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleFilterChange = (filtered) => {
    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePeriodChange = ({ startDate, endDate }) => {
    setDateRange({ startDate, endDate });
  };

  return (
    <div>
      <TimeFilter 
        transactions={transactions} 
        onFilterChange={handleFilterChange} 
        onPeriodChange={handlePeriodChange}
      />
      
      <div className="flex flex-row gap-6 items-start mb-6">
        <div className="w-64 flex-shrink-0">
          <SummaryCard 
            transactions={filteredTransactions} 
            startDate={dateRange.startDate} 
            endDate={dateRange.endDate} 
          />
        </div>
        <div className="flex-1">
          <ExpensesByCategory 
            transactions={filteredTransactions} 
            startDate={dateRange.startDate} 
            endDate={dateRange.endDate} 
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <div className="text-lg font-bold">Analysis</div>
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
            {displayedTransactions.slice(startIndex, endIndex).map((tx, idx) => (
              <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col.key} className="py-3 px-4">{tx[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredTransactions.length}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default MonthlyAnalysis; 