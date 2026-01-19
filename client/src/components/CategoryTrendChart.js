import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Filter } from 'lucide-react';

const CategoryTrendChart = ({ transactions }) => {
    const [selectedCategory, setSelectedCategory] = useState('Groceries'); // Default category

    // 1. Extract unique categories
    const categories = useMemo(() => {
        const unique = new Set(transactions.map(t => t.Category).filter(Boolean));
        return Array.from(unique).sort();
    }, [transactions]);

    // 2. Aggregate monthly data for the selected category
    const chartData = useMemo(() => {
        if (!selectedCategory) return [];

        const monthlyData = {};

        transactions.forEach(t => {
            if (t.Category === selectedCategory && t['Transaction Date']) {
                const date = new Date(t['Transaction Date']);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

                // Parse amount (handling potential negative values for debits if needed)
                // Assuming expenses are negative or positive, we usually want to visualize 'spend' as positive.
                // Let's assume standard bank export: negative = debit (expense), positive = credit (income).
                // But often users want to see "Spending", so we might flip negative numbers.
                // Let's check a few values. If most are negative, we flip them.
                let amount = parseFloat(t.Amount);

                // Simple heuristic: if it's an expense category, we typically want to see absolute spending.
                // For now, let's just sum the raw values and then decide how to display.
                // Actually, often in these apps, 'Amount' is positive for everything or negative for spend.
                // Let's assume typical: negative = spend.
                // We will sum them up.

                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = 0;
                }
                monthlyData[monthKey] += amount;
            }
        });

        // Convert to array and sort
        return Object.entries(monthlyData)
            .map(([month, amount]) => {
                const [y, m] = month.split('-').map(Number);
                // Create date using local time constructor (Year, MonthIndex, Day)
                // MonthIndex is 0-based, so m-1
                const displayDate = new Date(y, m - 1, 1);

                return {
                    month, // YYYY-MM
                    displayMonth: displayDate.toLocaleDateString('default', { month: 'long' }),
                    amount: Math.abs(amount) // Visualizing MAGNITUDE of spending
                };
            })
            .sort((a, b) => a.month.localeCompare(b.month)); // Sort chronological
    }, [transactions, selectedCategory]);

    if (transactions.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 transition-all hover:shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <TrendingUp size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Category Trends</h2>
                    </div>
                    <p className="text-sm text-gray-500 ml-1">Track monthly spending fluctuations</p>
                </div>

                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Filter size={14} />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer hover:bg-gray-100 transition-colors py-2"
                        style={{ minWidth: '180px' }}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    {/* Custom chevron */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="displayMonth"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickMargin={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(val) => `$${val}`}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value) => [`$${value.toFixed(2)}`, 'Spending']}
                            />
                            <Bar
                                dataKey="amount"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                                animationDuration={1000}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        No data for this category
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryTrendChart;
