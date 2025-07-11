import React, { useState } from 'react';
import UploadCSV from './components/UploadCSV';
import Chatbot from './components/Chatbot';

const sidebarItems = [
  { label: 'Overview', icon: '🏠' },
  { label: 'Balances', icon: '💰' },
  { label: 'Transactions', icon: '💳' },
  { label: 'Bills', icon: '🧾' },
  { label: 'Expenses', icon: '📊' },
  { label: 'Goals', icon: '🎯' },
  { label: 'Settings', icon: '⚙️' },
];

function App() {
  const [csvFile, setCsvFile] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between py-6 px-4">
        <div>
          <div className="text-2xl font-bold mb-8 tracking-wide">FINSight</div>
          <nav className="space-y-2">
            {sidebarItems.map(item => (
              <div key={item.label} className="flex items-center px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer transition">
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 mt-8">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg">TR</div>
          <div>
            <div className="font-semibold">Tanzir Rahman</div>
            <div className="text-xs text-slate-400">View profile</div>
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 bg-slate-100 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Hello, Tanzir</h1>
            <div className="text-slate-500 text-sm">May 19, 2023</div>
          </div>
          <input className="rounded-lg px-4 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Search here" />
        </div>
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Balance */}
          <div className="bg-white rounded-xl shadow p-6 col-span-1 flex flex-col justify-between">
            <div className="text-slate-500 text-sm mb-2">Total Balance</div>
            <div className="text-3xl font-bold mb-2">$240,399</div>
            <div className="flex items-center gap-2">
              <div className="bg-slate-200 rounded px-3 py-1 text-xs font-semibold">Credit Card</div>
              <div className="text-slate-400 text-xs">**** 2598</div>
              <div className="ml-auto text-green-600 font-bold">$25,000</div>
            </div>
          </div>
          {/* Goals */}
          <div className="bg-white rounded-xl shadow p-6 col-span-1 flex flex-col justify-between">
            <div className="text-slate-500 text-sm mb-2">Goals</div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">$20,000</div>
              <div className="text-xs text-slate-400">May, 2023</div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full mb-2">
              <div className="h-2 bg-green-500 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <div className="text-xs text-slate-500">Target Achieved: $12,500 / $20,000</div>
          </div>
          {/* Upcoming Bill */}
          <div className="bg-white rounded-xl shadow p-6 col-span-1 flex flex-col justify-between">
            <div className="text-slate-500 text-sm mb-2">Upcoming Bill</div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Figma - Monthly</div>
                  <div className="text-xs text-slate-400">May 15</div>
                </div>
                <div className="font-bold">$150</div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Adobe - Yearly</div>
                  <div className="text-xs text-slate-400">Jun 16</div>
                </div>
                <div className="font-bold">$559</div>
              </div>
            </div>
          </div>
        </div>
        {/* Recent Transactions & Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow p-6 col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div className="font-semibold">Recent Transactions</div>
              <button className="text-xs text-slate-500 hover:underline">View All</button>
            </div>
            <div className="divide-y divide-slate-100">
              {['GTR 5', 'Polo Shirt', 'Biriyani', 'Taxi Fare', 'Keyboard'].map((item, idx) => (
                <div key={item} className="flex justify-between py-2 items-center">
                  <div>
                    <div className="font-medium">{item}</div>
                    <div className="text-xs text-slate-400">17 May 2023</div>
                  </div>
                  <div className="font-bold">${[160, 20, 10, 12, 22][idx]}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Statistics */}
          <div className="bg-white rounded-xl shadow p-6 col-span-1">
            <div className="font-semibold mb-4">Weekly Comparison</div>
            {/* Placeholder for chart */}
            <div className="h-32 flex items-end gap-2">
              {[60, 40, 80, 30, 90, 50, 70].map((val, idx) => (
                <div key={idx} className="bg-slate-300 rounded w-6" style={{ height: `${val}%` }}></div>
              ))}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex justify-between">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span key={day}>{day}</span>)}
            </div>
          </div>
        </div>
        {/* Expenses Breakdown */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="font-semibold mb-4">Expenses Breakdown</div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { label: 'Housing', amount: 250 },
              { label: 'Food', amount: 350 },
              { label: 'Transportation', amount: 50 },
              { label: 'Entertainment', amount: 80 },
              { label: 'Shopping', amount: 420 },
              { label: 'Others', amount: 650 },
            ].map((cat) => (
              <div key={cat.label} className="bg-slate-50 rounded-lg p-4 flex flex-col items-center">
                <div className="font-bold text-lg">${cat.amount}</div>
                <div className="text-xs text-slate-500">{cat.label}</div>
              </div>
            ))}
          </div>
        </div>
        {/* CSV Upload & Chatbot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="font-semibold mb-2">Upload Transactions</div>
            <UploadCSV onFileUpload={setCsvFile} />
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="font-semibold mb-2">FinSight Chatbot</div>
            <Chatbot />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
