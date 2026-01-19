import React, { useState } from 'react';
import Pagination from './Pagination';
import CategoryTrendChart from './CategoryTrendChart';
import ChatbotSidebar from './ChatbotSidebar';

const Overview = ({ transactions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const columns = [
    { key: 'Transaction Date', label: 'Transaction Date' },
    { key: 'Description', label: 'Description' },
    { key: 'Category', label: 'Category' },
    { key: 'Amount', label: 'Amount' }
  ];

  // Pagination calculations
  const totalPages = Math.ceil(transactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  return (
    <div className="flex bg-gray-50 -m-8 h-[calc(100vh)]"> {/* Negative margin to counteract main padding, full height */}
      <div className="flex-1 overflow-y-auto p-8 h-full w-full min-w-0"> {/* Main content wrapper with padding restoring */}
        <CategoryTrendChart transactions={transactions} />

        <div className="flex justify-between items-center mb-4 mt-8">
          <div className="text-lg font-bold">Transactions</div>
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={transactions.length}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <ChatbotSidebar />
    </div>
  );
};

export default Overview; 