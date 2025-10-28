import React, { useState, useEffect } from 'react';
import SummaryCard from './SummaryCard';
import TimeFilter from './TimeFilter';
import Pagination from './Pagination';
import ExpensesByCategory from './ExpensesByCategory';

const MonthlyAnalysis = ({ transactions, onRefresh }) => {
  console.log('MonthlyAnalysis received transactions:', transactions?.length || 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const columns = [
    { key: 'Transaction Date', label: 'Transaction Date' },
    { key: 'Description', label: 'Description', editable: true },
    { key: 'Category', label: 'Category', editable: true },
    { key: 'Amount', label: 'Amount' }
  ];

  // Load categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/categories');
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Helper function to sort transactions by date (newest first)
  const sortTransactionsByDate = (txs) => {
    return [...txs].sort((a, b) => {
      const dateA = new Date(a['Transaction Date']);
      const dateB = new Date(b['Transaction Date']);
      return dateB - dateA; // Newest first
    });
  };

  // Update filtered transactions when props change
  React.useEffect(() => {
    const sortedTransactions = sortTransactionsByDate(transactions);
    setFilteredTransactions(sortedTransactions);
  }, [transactions]);

  // Pagination calculations based on filtered transactions
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleFilterChange = (filtered) => {
    const sortedFiltered = sortTransactionsByDate(filtered);
    setFilteredTransactions(sortedFiltered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePeriodChange = ({ startDate, endDate }) => {
    setDateRange({ startDate, endDate });
  };

  // Edit mode functions
  const handleEditModeToggle = () => {
    if (isEditMode && Object.keys(pendingChanges).length > 0) {
      // Save pending changes before exiting edit mode
      saveChanges();
    } else {
      const newEditMode = !isEditMode;
      setIsEditMode(newEditMode);
      setEditingCell(null);
      setPendingChanges({});
    }
  };

  const handleCancelEdit = () => {
    // Cancel all pending changes and exit edit mode
    setPendingChanges({});
    setEditingCell(null);
    setIsEditMode(false);
  };

  const handleCellClick = (transactionIndex, columnKey) => {
    if (!isEditMode) return;
    
    // Check if this column is editable
    const column = columns.find(col => col.key === columnKey);
    if (!column || !column.editable) return;
    
    const cellKey = `${transactionIndex}-${columnKey}`;
    setEditingCell(cellKey);
  };

  const handleCellChange = (transactionIndex, columnKey, value) => {
    const cellKey = `${transactionIndex}-${columnKey}`;
    setPendingChanges(prev => ({
      ...prev,
      [cellKey]: {
        transactionIndex,
        columnKey,
        value
      }
    }));
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const saveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return;

    setIsSaving(true);
    try {
      const updates = Object.values(pendingChanges).map(change => {
        // Get the original transaction data to help backend find the right row
        const originalTransaction = filteredTransactions[change.transactionIndex];
        return {
          id: change.transactionIndex.toString(),
          transactionData: {
            'Transaction Date': originalTransaction['Transaction Date'],
            'Description': originalTransaction['Description'],
            'Amount': originalTransaction['Amount']
          },
          updates: {
            [change.columnKey]: change.value
          }
        };
      });

      const response = await fetch('http://localhost:8000/transactions/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        setPendingChanges({});
        setEditingCell(null);
        setIsEditMode(false);
        // Refresh the transaction data
        console.log('About to refresh data...');
        if (onRefresh) {
          console.log('Calling onRefresh...');
          await onRefresh();
          console.log('onRefresh completed');
        } else {
          console.log('onRefresh is not available');
        }
        
        // Force a page reload to ensure we get the latest data
        console.log('Forcing page reload...');
        window.location.reload();
      } else {
        const error = await response.json();
        console.error('Error saving changes:', error);
        alert('Failed to save changes. Please try again.');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getCellValue = (transaction, columnKey, transactionIndex) => {
    const cellKey = `${transactionIndex}-${columnKey}`;
    const pendingChange = pendingChanges[cellKey];
    return pendingChange ? pendingChange.value : transaction[columnKey];
  };

  // Debug: Show transaction count
  console.log('MonthlyAnalysis render - transactions:', transactions?.length || 0, 'filtered:', filteredTransactions?.length || 0);

  return (
    <div>
      {!transactions || transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No transactions found. Please upload some CSV files first.
        </div>
      ) : (
        <>
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
          <button 
            onClick={handleEditModeToggle}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              isEditMode 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : isEditMode ? 'Save & Exit Edit' : 'Edit'}
          </button>
          {isEditMode && (
            <>
              {Object.keys(pendingChanges).length > 0 && (
                <button 
                  onClick={saveChanges}
                  className="px-3 py-2 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
              <button 
                onClick={handleCancelEdit}
                className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                disabled={isSaving}
              >
                Cancel
              </button>
            </>
          )}
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
              <tr 
                key={idx} 
                className={`border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                  isEditMode ? 'bg-amber-50/30' : ''
                }`}
              >
                {columns.map(col => {
                  const cellKey = `${startIndex + idx}-${col.key}`;
                  const isEditing = editingCell === cellKey;
                  const cellValue = getCellValue(tx, col.key, startIndex + idx);
                  const hasPendingChange = pendingChanges[`${startIndex + idx}-${col.key}`];
                  
                  return (
                    <td 
                      key={col.key} 
                      className={`py-3 px-4 relative transition-all ${
                        col.editable && isEditMode 
                          ? 'cursor-pointer group hover:bg-amber-50/50' 
                          : ''
                      }`}
                      onClick={() => handleCellClick(startIndex + idx, col.key)}
                    >
                      {isEditing ? (
                        col.key === 'Category' ? (
                          <select
                            value={cellValue}
                            onChange={(e) => handleCellChange(startIndex + idx, col.key, e.target.value)}
                            onBlur={handleCellBlur}
                            className="w-full p-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                            autoFocus
                          >
                            {categories.map(category => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={cellValue}
                            onChange={(e) => handleCellChange(startIndex + idx, col.key, e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellBlur();
                              }
                            }}
                            className="w-full p-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                            autoFocus
                          />
                        )
                      ) : (
                        <span className="flex items-center gap-1">
                          {cellValue}
                          {col.editable && isEditMode && !isEditing && (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 text-xs">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </span>
                          )}
                        </span>
                      )}
                      {hasPendingChange && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full"></span>
                      )}
                    </td>
                  );
                })}
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
        </>
      )}
    </div>
  );
};

export default MonthlyAnalysis; 