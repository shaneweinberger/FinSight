import React, { useState, useEffect } from 'react';

const TimeFilter = ({ transactions, onFilterChange, onPeriodChange }) => {
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'weekly'
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState([]);

  // Generate available periods based on view mode and transactions
  useEffect(() => {
    if (!transactions.length) return;

    const periods = new Set();
    
    transactions.forEach(tx => {
      const date = new Date(tx['Transaction Date']);
      
      if (viewMode === 'monthly') {
        // Format: YYYY-MM (e.g., "2024-07")
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        periods.add(monthKey);
      } else {
        // Format: YYYY-WW (e.g., "2024-28" for week 28 of 2024)
        const year = date.getFullYear();
        const week = getWeekNumber(date);
        const weekKey = `${year}-${String(week).padStart(2, '0')}`;
        periods.add(weekKey);
      }
    });

    const sortedPeriods = Array.from(periods).sort().reverse(); // Most recent first
    setAvailablePeriods(sortedPeriods);
    
    // Auto-select the most recent period
    if (sortedPeriods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(sortedPeriods[0]);
    }
  }, [transactions, viewMode]);

  // Get week number for a date
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Filter transactions based on selected period
  useEffect(() => {
    if (!selectedPeriod || !transactions.length) {
      onFilterChange(transactions);
      return;
    }

    const filtered = transactions.filter(tx => {
      const txDate = new Date(tx['Transaction Date']);
      
      if (viewMode === 'monthly') {
        // Check if transaction is in selected month
        const txMonthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        return txMonthKey === selectedPeriod;
      } else {
        // Check if transaction is in selected week
        const txYear = txDate.getFullYear();
        const txWeek = getWeekNumber(txDate);
        const txWeekKey = `${txYear}-${String(txWeek).padStart(2, '0')}`;
        return txWeekKey === selectedPeriod;
      }
    });

    onFilterChange(filtered);
  }, [selectedPeriod, viewMode, transactions, onFilterChange]);

  // Helper to get start and end dates for a period
  const getPeriodRange = (period, mode) => {
    if (!period) return { startDate: '', endDate: '' };
    if (mode === 'monthly') {
      const [year, month] = period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // last day of month
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };
    } else {
      const [year, week] = period.split('-');
      // Week starts on Monday
      const simple = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
      const dayOfWeek = simple.getDay();
      const ISOweekStart = new Date(simple);
      if (dayOfWeek <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
      else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
      const ISOweekEnd = new Date(ISOweekStart);
      ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
      return {
        startDate: ISOweekStart.toISOString().split('T')[0],
        endDate: ISOweekEnd.toISOString().split('T')[0],
      };
    }
  };

  // Callbacks for when period changes
  useEffect(() => {
    if (onPeriodChange) {
      const { startDate, endDate } = getPeriodRange(selectedPeriod, viewMode);
      onPeriodChange({ startDate, endDate, viewMode, selectedPeriod });
    }
  }, [selectedPeriod, viewMode, onPeriodChange]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSelectedPeriod(''); // Reset selection when changing view mode
  };

  const formatPeriodLabel = (period) => {
    if (viewMode === 'monthly') {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } else {
      const [year, week] = period.split('-');
      // Get the Monday date for this week
      const simple = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
      const dayOfWeek = simple.getDay();
      const mondayDate = new Date(simple);
      if (dayOfWeek <= 4)
        mondayDate.setDate(simple.getDate() - simple.getDay() + 1);
      else
        mondayDate.setDate(simple.getDate() + 8 - simple.getDay());
      
      return mondayDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  return (
    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 font-medium">View:</span>
        <div className="flex bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => handleViewModeChange('monthly')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              viewMode === 'monthly' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => handleViewModeChange('weekly')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              viewMode === 'weekly' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 font-medium">
          {viewMode === 'monthly' ? 'Month:' : 'Week:'}
        </label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">All {viewMode === 'monthly' ? 'Months' : 'Weeks'}</option>
          {availablePeriods.map(period => (
            <option key={period} value={period}>
              {formatPeriodLabel(period)}
            </option>
          ))}
        </select>
      </div>
      
      {selectedPeriod && (
        <span className="text-sm text-gray-500">
          Showing {formatPeriodLabel(selectedPeriod)}
        </span>
      )}
    </div>
  );
};

export default TimeFilter; 