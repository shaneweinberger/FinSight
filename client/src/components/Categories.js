import React, { useState, useEffect } from 'react';
import { Trash2, Plus, RefreshCw, AlertCircle } from 'lucide-react';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:8000/categories');
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            setCategories(data.categories || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        try {
            const response = await fetch('http://localhost:8000/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: newCategory.trim() }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to add category');
            }

            setNewCategory('');
            fetchCategories();
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleDeleteCategory = async (category) => {
        if (!window.confirm(`Are you sure you want to delete "${category}"?`)) return;

        try {
            const response = await fetch(`http://localhost:8000/categories/${encodeURIComponent(category)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete category');
            }

            fetchCategories();
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleReprocess = async () => {
        if (!window.confirm('This will reprocess all transactions using the current categories. This may take a while. Continue?')) return;

        setProcessing(true);
        setProcessingStatus('Starting reprocessing...');
        setError(null);

        try {
            // Reprocess credit files
            setProcessingStatus('Reprocessing credit transactions...');
            const creditRes = await fetch('http://localhost:8000/reprocess/credit', { method: 'POST' });
            if (!creditRes.ok) throw new Error('Failed to reprocess credit transactions');

            // Reprocess debit files
            setProcessingStatus('Reprocessing debit transactions...');
            const debitRes = await fetch('http://localhost:8000/reprocess/debit', { method: 'POST' });
            if (!debitRes.ok) throw new Error('Failed to reprocess debit transactions');

            setProcessingStatus('Reprocessing complete!');
            setTimeout(() => {
                setProcessing(false);
                setProcessingStatus('');
            }, 3000);
        } catch (err) {
            setError(err.message);
            setProcessing(false);
            setProcessingStatus('');
        }
    };

    if (loading) return <div className="p-6">Loading categories...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
                <button
                    onClick={handleReprocess}
                    disabled={processing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    <RefreshCw size={18} className={processing ? 'animate-spin' : ''} />
                    {processing ? 'Reprocessing...' : 'Reprocess All Transactions'}
                </button>
            </div>

            {processingStatus && (
                <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2">
                    <RefreshCw size={18} className="animate-spin" />
                    {processingStatus}
                </div>
            )}

            {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <form onSubmit={handleAddCategory} className="flex gap-2">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Enter new category name..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            type="submit"
                            disabled={!newCategory.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                        >
                            <Plus size={18} />
                            Add Category
                        </button>
                    </form>
                </div>

                <div className="divide-y divide-gray-100">
                    {categories.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No categories found. Add one to get started.</div>
                    ) : (
                        categories.map((category) => (
                            <div key={category} className="flex justify-between items-center p-4 hover:bg-gray-50 transition">
                                <span className="font-medium text-gray-700">{category}</span>
                                <button
                                    onClick={() => handleDeleteCategory(category)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Delete category"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold mb-1">Note about categories:</p>
                        <p>
                            Adding or removing categories here will update the list used for future transaction processing.
                            To apply these changes to existing transactions, use the "Reprocess All Transactions" button above.
                            This may take several minutes depending on the number of transactions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;
