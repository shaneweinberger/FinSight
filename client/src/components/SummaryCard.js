import React from 'react';

const SummaryCard = ({ label, value, change, changeColor, sub }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-2">
      <div className="text-gray-500 text-xs font-semibold">{label}</div>
      <div className="flex items-end gap-2">
        <div className="text-2xl font-bold">{value}</div>
        <div className={`text-xs font-semibold ${changeColor}`}>{change}</div>
      </div>
      <div className="text-xs text-gray-400">{sub}</div>
      {/* Simple chart placeholder */}
      <div className="h-8 mt-2 bg-gray-100 rounded w-full flex items-center justify-center text-gray-300 text-xs">[Chart]</div>
    </div>
  );
};

export default SummaryCard; 