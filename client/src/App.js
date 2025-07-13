import React, { useState, useRef } from 'react';

const sidebarLinks = [
  { label: 'Dashboard', icon: '🏠' },
  { label: 'Product Analytics', icon: '📊' },
  { label: 'Shop Analyzer', icon: '🛒' },
  { label: 'Keyword Research', icon: '🔑' },
  { label: 'Watchlist', icon: '👁️' },
  { label: 'Etsy Calculator', icon: '🧮' },
  { label: 'Extension', icon: '🧩' },
  { label: 'Affiliate Program', icon: '🤝' },
  { label: 'Upgrade', icon: '⬆️' },
];

const summaryCards = [
  {
    label: 'Avg. Monthly Revenue',
    value: '$4,250.25',
    change: '+2.15%',
    changeColor: 'text-green-600',
    sub: 'From last month',
  },
  {
    label: 'Avg. Monthly Sales',
    value: '1,230',
    change: '+4.12%',
    changeColor: 'text-green-600',
    sub: 'From last month',
  },
  {
    label: 'Avg. Favorites',
    value: '13,180',
    change: '-1.20%',
    changeColor: 'text-red-500',
    sub: 'From last month',
  },
  {
    label: 'Search Volume',
    value: '2,440',
    change: '+2.15%',
    changeColor: 'text-green-600',
    sub: 'From last month',
  },
];

const transactions = [
  {
    product: 'New Balance Men\'s 608 V5 Casual',
    price: '$45',
    shop: 'WearPhysique',
    shopColor: 'bg-blue-100 text-blue-700',
    score: 95,
    revenue: '$27,450',
    img: 'https://via.placeholder.com/40',
  },
  {
    product: 'Sperry Top-Sider Men\'s Billfish Ultralite',
    price: '$72',
    shop: 'MuwaitUK',
    shopColor: 'bg-pink-100 text-pink-700',
    score: 80,
    revenue: '$15,340',
    img: 'https://via.placeholder.com/40',
  },
  {
    product: 'Men\'s Minimalist Stainless Steel Slim',
    price: '$124',
    shop: 'SeFashion',
    shopColor: 'bg-gray-100 text-gray-700',
    score: 55,
    revenue: '$12,380',
    img: 'https://via.placeholder.com/40',
  },
  {
    product: 'Timberland Men\'s Classic Leather',
    price: '$32',
    shop: 'Twoday',
    shopColor: 'bg-orange-100 text-orange-700',
    score: 95,
    revenue: '$8,750',
    img: 'https://via.placeholder.com/40',
  },
  {
    product: 'KBETHOS Original Classic Low Profile',
    price: '$24',
    shop: 'Manifestable',
    shopColor: 'bg-yellow-100 text-yellow-700',
    score: 80,
    revenue: '$6,450',
    img: 'https://via.placeholder.com/40',
  },
  {
    product: 'Light Abstract Shapes iPhone 14 Case',
    price: '$27',
    shop: 'JewalinCo',
    shopColor: 'bg-purple-100 text-purple-700',
    score: 75,
    revenue: '$5,840',
    img: 'https://via.placeholder.com/40',
  },
  {
    product: 'Embroidered BMO Beanie Hat',
    price: '$14',
    shop: 'MinimalFas',
    shopColor: 'bg-green-100 text-green-700',
    score: 95,
    revenue: '$5,655',
    img: 'https://via.placeholder.com/40',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Product Analytics');
  const [csvFile, setCsvFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
    setUploadStatus('');
  };

  const handleUpload = async () => {
    if (!csvFile) {
      setUploadStatus('Please select a CSV file.');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      const response = await fetch('http://192.168.4.22:8000/upload-csv', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setUploadStatus('Upload successful!');
        setCsvFile(null);
      } else {
        setUploadStatus(data.error || 'Upload failed.');
      }
    } catch (err) {
      setUploadStatus('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between py-6 px-4">
        <div>
          {/* Logo and user */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">🏆</div>
            <div>
              <div className="font-semibold text-gray-800">Maria's Jewelry</div>
              <div className="text-xs text-gray-400">2,540 Sales</div>
            </div>
          </div>
          {/* Navigation */}
          <nav className="space-y-1">
            {sidebarLinks.map((item, idx) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition text-gray-700 hover:bg-gray-100 ${item.label === 'Product Analytics' ? 'bg-gray-100 font-semibold' : ''}`}
                onClick={() => setActiveTab(item.label)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
          {/* Plan/Upgrade */}
          <div className="mt-8 bg-gray-100 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">Product Analytics</div>
              <div className="font-bold text-lg">4/10</div>
            </div>
            <button className="text-xs text-blue-600 font-semibold underline">Upgrade Plan →</button>
          </div>
        </div>
        <div className="mt-8">
          <button className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold flex items-center justify-center gap-2">
            <span>＋</span> Add to Chrome, It's Free
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <input
              className="rounded-lg px-4 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              placeholder="Search..."
            />
            <button className="ml-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-500 text-sm">⌨️ K</button>
            {/* CSV Upload */}
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="ml-2 px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition"
              disabled={isUploading}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              Select CSV
            </button>
            <button
              type="button"
              className="ml-2 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition"
              disabled={!csvFile || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? 'Uploading...' : 'Upload CSV'}
            </button>
            {uploadStatus && (
              <span className={`ml-2 text-xs ${uploadStatus.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{uploadStatus}</span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 text-gray-500">
              <span>USD</span>
              <span>▼</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-700">OE</div>
            <div className="text-right">
              <div className="font-semibold text-gray-800">Omer Erdogan</div>
              <div className="text-xs text-gray-400">Hobby</div>
            </div>
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow p-6 flex flex-col gap-2">
              <div className="text-gray-500 text-xs font-semibold">{card.label}</div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold">{card.value}</div>
                <div className={`text-xs font-semibold ${card.changeColor}`}>{card.change}</div>
              </div>
              <div className="text-xs text-gray-400">{card.sub}</div>
              {/* Simple chart placeholder */}
              <div className="h-8 mt-2 bg-gray-100 rounded w-full flex items-center justify-center text-gray-300 text-xs">[Chart]</div>
            </div>
          ))}
        </div>
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeTab === 'Product Analytics' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('Product Analytics')}
          >
            Product Analytics
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeTab === 'Tag Analytics' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('Tag Analytics')}
          >
            Tag Analytics
          </button>
        </div>
        {/* Table Controls */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-lg font-bold">Product Analytics</div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm">Customize</button>
            <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm">Filter</button>
            <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm">Export</button>
          </div>
        </div>
        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b">
                <th className="py-3 px-4 text-left font-semibold"><input type="checkbox" /></th>
                <th className="py-3 px-4 text-left font-semibold">Product</th>
                <th className="py-3 px-4 text-left font-semibold">Price</th>
                <th className="py-3 px-4 text-left font-semibold">Shop Name</th>
                <th className="py-3 px-4 text-left font-semibold">Visibility Score</th>
                <th className="py-3 px-4 text-right font-semibold">Mo. Revenue</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={idx} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="py-3 px-4"><input type="checkbox" /></td>
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img src={tx.img} alt="product" className="w-10 h-10 rounded object-cover border" />
                    <span className="font-medium text-gray-800 truncate max-w-xs">{tx.product}</span>
                  </td>
                  <td className="py-3 px-4">{tx.price}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${tx.shopColor}`}>{tx.shop}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${tx.score}%` }}></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{tx.score}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-800">{tx.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <div>Showing 7 of 7</div>
          <div className="flex gap-1">
            <button className="px-2 py-1 rounded bg-gray-100">1</button>
            <button className="px-2 py-1 rounded bg-gray-100">2</button>
            <span>...</span>
            <button className="px-2 py-1 rounded bg-gray-100">10</button>
          </div>
          <div>Lines per page <span className="font-semibold">7/12</span></div>
        </div>
      </main>
    </div>
  );
}