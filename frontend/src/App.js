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
          <div className="text-2xl font-bold mb-8 tracking-wide text-green-300">w<span className="text-white">wealty</span></div>
          <nav className="space-y-2">
            {sidebarItems.map((item, idx) => (
              <div key={item.label} className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition ${idx === 0 ? 'bg-slate-800' : 'hover:bg-slate-800'}`}> {/* Highlight Overview */}
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </nav>
          {/* CSV Upload Link */}
          <div className="mt-6">
            <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition">Upload CSV</button>
          </div>
        </div>
        {/* Support Box */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <div className="font-semibold mb-2">Have a question?</div>
          <div className="text-xs text-slate-400 mb-3">Send us a message and we will get back to you in no time.</div>
          <button className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-2 rounded-lg font-semibold transition">Contact us</button>
        </div>
        <button className="text-slate-400 hover:text-white text-left">Log out</button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 bg-slate-100 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, Shane</h1>
            <div className="text-slate-500 text-sm">Here's an overview of all of your balances.</div>
          </div>
          {/* Profile Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-lg">A</div>
          </div>
        </div>
        {/* Account Balance Chart */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 col-span-2 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <div className="font-semibold">Account Balance</div>
              <div className="flex gap-2">
                {['Day', 'Week', 'Month', 'Year'].map((t) => (
                  <button key={t} className="px-3 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200">{t}</button>
                ))}
              </div>
            </div>
            {/* Placeholder for chart */}
            <div className="h-40 bg-slate-50 rounded flex items-center justify-center text-slate-400">[Chart Placeholder]</div>
          </div>
          {/* Summary Cards */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow p-4 flex flex-col">
              <div className="text-slate-500 text-sm mb-1">Total Balance</div>
              <div className="text-xl font-bold mb-1">$11,716.77</div>
              <div className="text-green-500 text-xs font-semibold">+4%</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex flex-col">
              <div className="text-slate-500 text-sm mb-1">Main Account</div>
              <div className="text-xl font-bold">$3,252.13</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex flex-col">
              <div className="text-slate-500 text-sm mb-1">Savings</div>
              <div className="text-xl font-bold">$4,000.00</div>
              <div className="text-green-500 text-xs font-semibold">+10%</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 flex flex-col">
              <div className="text-slate-500 text-sm mb-1">Investments</div>
              <div className="text-xl font-bold">$4,436.64</div>
              <div className="text-green-500 text-xs font-semibold">+27.24%</div>
            </div>
          </div>
        </div>
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="font-semibold">Recent Transactions</div>
            <button className="text-xs text-slate-500 hover:underline">See all</button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="py-2">Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Daniel Cole', date: 'Today', time: '21:09', status: 'Pending', amount: '-$100.00', statusColor: 'bg-yellow-100 text-yellow-700' },
                { name: 'Tina Wallace', date: '11 Dec', time: '11:31', status: 'Completed', amount: '-$25.00', statusColor: 'bg-green-100 text-green-700' },
                { name: 'Amazon', date: '11 Dec', time: '09:16', status: 'Completed', amount: '-$246.50', statusColor: 'bg-green-100 text-green-700' },
              ].map((tx, idx) => (
                <tr key={idx} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{tx.name}</td>
                  <td>{tx.date}</td>
                  <td>{tx.time}</td>
                  <td><span className={`px-2 py-1 rounded text-xs font-semibold ${tx.statusColor}`}>{tx.status}</span></td>
                  <td className="text-right font-bold">{tx.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;
