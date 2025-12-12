import React, { useState, useEffect } from 'react';

const TimeFilter = ({ transactions, onFilterChange, onPeriodChange }) => {
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly', 'weekly', 'custom', 'all'
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Helper to normalize date to YYYY-MM-DD string (preserving local date semantics)
  const toISODateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Generate available periods based on view mode and transactions
  useEffect(() => {
    if (!transactions.length || (viewMode !== 'monthly' && viewMode !== 'weekly')) return;

    const periods = new Set();

    transactions.forEach(tx => {
      const date = new Date(tx['Transaction Date']);
      // Handle potential invalid dates
      if (isNaN(date.getTime())) return;

      if (viewMode === 'monthly') {
        // Format: YYYY-MM (e.g., "2024-07")
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        periods.add(monthKey);
      } else if (viewMode === 'weekly') {
        // Format: YYYY-WW (e.g., "2024-28" for week 28 of 2024)
        const year = date.getFullYear();
        const week = getWeekNumber(date);
        const weekKey = `${year}-${String(week).padStart(2, '0')}`;
        periods.add(weekKey);
      }
    });

    const sortedPeriods = Array.from(periods).sort().reverse(); // Most recent first
    setAvailablePeriods(sortedPeriods);

    // Auto-select the most recent period if none selected
    if (sortedPeriods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(sortedPeriods[0]);
    }
  }, [transactions, viewMode]);

  // Initialize custom date range with min/max transaction dates when switching to custom/all
  useEffect(() => {
    if (transactions.length > 0) {
      const dates = transactions.map(tx => new Date(tx['Transaction Date'])).filter(d => !isNaN(d));
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        if (!customStartDate) setCustomStartDate(toISODateString(minDate));
        if (!customEndDate) setCustomEndDate(toISODateString(maxDate));
      }
    }
  }, [transactions]);

  // Get week number for a date
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Filter transactions based on selection
  useEffect(() => {
    if (!transactions.length) {
      onFilterChange([]);
      return;
    }

    let filtered = [];
    let startStr = '';
    let endStr = '';

    if (viewMode === 'all') {
      filtered = transactions;
      // Get full range
      const dates = transactions.map(tx => new Date(tx['Transaction Date'])).filter(d => !isNaN(d));
      if (dates.length > 0) {
        startStr = toISODateString(new Date(Math.min(...dates)));
        endStr = toISODateString(new Date(Math.max(...dates)));
      }
    } else if (viewMode === 'custom') {
      if (customStartDate && customEndDate) {
        filtered = transactions.filter(tx => {
          const txDate = new Date(tx['Transaction Date']);
          if (isNaN(txDate.getTime())) return false;

          const txDateStr = toISODateString(txDate);
          // String comparison works for YYYY-MM-DD
          return txDateStr >= customStartDate && txDateStr <= customEndDate;
        });
        startStr = customStartDate;
        endStr = customEndDate;
      } else {
        filtered = transactions;
      }
    } else if (selectedPeriod) {
      // Monthly or Weekly
      filtered = transactions.filter(tx => {
        const txDate = new Date(tx['Transaction Date']);
        if (isNaN(txDate.getTime())) return false;

        if (viewMode === 'monthly') {
          const txMonthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
          return txMonthKey === selectedPeriod;
        } else {
          const txYear = txDate.getFullYear();
          const txWeek = getWeekNumber(txDate);
          const txWeekKey = `${txYear}-${String(txWeek).padStart(2, '0')}`;
          return txWeekKey === selectedPeriod;
        }
      });

      const range = getPeriodRange(selectedPeriod, viewMode);
      startStr = range.startDate;
      endStr = range.endDate;
    }

    onFilterChange(filtered);

    // Notify parent of the effective date range
    if (onPeriodChange) {
      onPeriodChange({
        startDate: startStr,
        endDate: endStr,
        viewMode,
        selectedPeriod
      });
    }

  }, [viewMode, selectedPeriod, customStartDate, customEndDate, transactions, onFilterChange, onPeriodChange]);

  // Helper to get start and end dates for a period
  const getPeriodRange = (period, mode) => {
    if (!period) return { startDate: '', endDate: '' };
    if (mode === 'monthly') {
      const [year, month] = period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // last day of month

      return {
        startDate: toISODateString(startDate),
        endDate: toISODateString(endDate)
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
        startDate: toISODateString(ISOweekStart),
        endDate: toISODateString(ISOweekEnd)
      };
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'monthly' || mode === 'weekly') {
      setSelectedPeriod(''); // Reset selection to force auto-select or empty
    }
    // For custom/all, we don't need selectedPeriod
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
    <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 font-medium">View:</span>
        <div className="flex bg-white border border-gray-200 rounded-lg p-1">
          {['monthly', 'weekly', 'custom', 'all'].map(mode => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode)}
              className={`px-3 py-1 rounded text-sm font-medium transition capitalize ${viewMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              {mode === 'all' ? 'All Data' : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Controls based on View Mode */}
      {(viewMode === 'monthly' || viewMode === 'weekly') && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">
            {viewMode === 'monthly' ? 'Month:' : 'Week:'}
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Select {viewMode === 'monthly' ? 'Month' : 'Week'}</option>
            {availablePeriods.map(period => (
              <option key={period} value={period}>
                {formatPeriodLabel(period)}
              </option>
            ))}
          </select>
        </div>
      )}

      {viewMode === 'custom' && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      )}

      {/* Current Selection Label */}
      {(selectedPeriod || viewMode === 'custom' || viewMode === 'all') && (
        <span className="text-sm text-gray-500 ml-auto font-medium">
          {viewMode === 'monthly' && selectedPeriod && formatPeriodLabel(selectedPeriod)}
          {viewMode === 'weekly' && selectedPeriod && `Week of ${formatPeriodLabel(selectedPeriod)}`}
          {viewMode === 'custom' && customStartDate && customEndDate && `${customStartDate} to ${customEndDate}`}
          {viewMode === 'all' && 'Showing All Transactions'}
        </span>
      )}
    </div>
  );
};

export default TimeFilter;