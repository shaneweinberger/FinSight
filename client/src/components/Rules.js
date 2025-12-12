import React, { useState, useEffect } from 'react';
import { Trash2, Plus, RefreshCw, AlertCircle, Edit2, X, Check } from 'lucide-react';

const Rules = () => {
    const [rules, setRules] = useState([]);
    const [newRule, setNewRule] = useState('');
    const [ruleType, setRuleType] = useState('both');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');
    const [lastReprocessed, setLastReprocessed] = useState(null);

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editType, setEditType] = useState('both');

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await fetch('http://localhost:8000/rules');
            if (!response.ok) throw new Error('Failed to fetch rules');
            const data = await response.json();
            setRules(data.rules || []);
            setLastReprocessed(data.last_reprocessed);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRule = async (e) => {
        e.preventDefault();
        if (!newRule.trim()) return;

        try {
            const response = await fetch('http://localhost:8000/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newRule.trim(),
                    type: ruleType
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to add rule');
            }

            setNewRule('');
            fetchRules();
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleDeleteRule = async (ruleId) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) return;

        try {
            const response = await fetch(`http://localhost:8000/rules/${ruleId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete rule');
            }

            fetchRules();
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        }
    };

    const startEditing = (rule) => {
        setEditingId(rule.id);
        setEditContent(rule.content);
        setEditType(rule.type);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditContent('');
        setEditType('both');
    };

    const saveEdit = async () => {
        if (!editContent.trim()) return;

        try {
            const response = await fetch(`http://localhost:8000/rules/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: editContent.trim(),
                    type: editType
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update rule');
            }

            setEditingId(null);
            fetchRules();
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleReprocess = async () => {
        if (!window.confirm('This will reprocess all transactions using the current rules. This may take a while. Continue?')) return;

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

            // Refresh rules to get updated timestamp
            fetchRules();

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

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleString();
    };

    if (loading) return <div className="p-6">Loading rules...</div>;

    const creditRules = rules.filter(r => r.type === 'credit' || r.type === 'both');
    const debitRules = rules.filter(r => r.type === 'debit' || r.type === 'both');

    const renderRuleItem = (rule) => {
        const isEditing = editingId === rule.id;

        if (isEditing) {
            return (
                <div key={rule.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                    <div className="flex flex-col gap-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="2"
                        />
                        <div className="flex justify-between items-center">
                            <select
                                value={editType}
                                onChange={(e) => setEditType(e.target.value)}
                                className="p-1 border border-blue-300 rounded text-sm"
                            >
                                <option value="both">Both</option>
                                <option value="credit">Credit Only</option>
                                <option value="debit">Debit Only</option>
                            </select>
                            <div className="flex gap-2">
                                <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                    <Check size={18} />
                                </button>
                                <button onClick={cancelEditing} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={rule.id} className="flex justify-between items-start p-3 bg-white border border-gray-100 rounded-lg mb-2 hover:shadow-sm transition">
                <div className="flex-1">
                    <p className="text-gray-800">{rule.content}</p>
                    {rule.type !== 'both' && (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded mt-1 inline-block uppercase">
                            {rule.type} ONLY
                        </span>
                    )}
                </div>
                <div className="flex gap-1 ml-2">
                    <button
                        onClick={() => startEditing(rule)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit rule"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete rule"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Rules Management</h1>
                    <p className="text-gray-600 mt-1">Define smart rules for categorization and cleaning.</p>
                </div>
                <div className="text-right">
                    <button
                        onClick={handleReprocess}
                        disabled={processing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition mb-2 ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        <RefreshCw size={18} className={processing ? 'animate-spin' : ''} />
                        {processing ? 'Reprocessing...' : 'Reprocess All'}
                    </button>
                    <p className="text-xs text-gray-500">
                        Last Reprocessed: <span className="font-medium">{formatDate(lastReprocessed)}</span>
                    </p>
                </div>
            </div>

            {processingStatus && (
                <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2">
                    <RefreshCw size={18} className="animate-spin" />
                    {processingStatus}
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Add Rule Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Rule</h3>
                <form onSubmit={handleAddRule} className="flex gap-4 items-start">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={newRule}
                            onChange={(e) => setNewRule(e.target.value)}
                            placeholder='e.g., "Transactions less than $5 are Coffee" or "Delete transactions containing TEST"'
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="w-40">
                        <select
                            value={ruleType}
                            onChange={(e) => setRuleType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="both">Credit & Debit</option>
                            <option value="credit">Credit Only</option>
                            <option value="debit">Debit Only</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={!newRule.trim()}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Rule
                    </button>
                </form>
            </div>

            {/* Rules Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Credit Rules Column */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                        Credit Rules
                    </h2>
                    <div className="space-y-2">
                        {creditRules.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">No active credit rules.</p>
                        ) : (
                            creditRules.map(renderRuleItem)
                        )}
                    </div>
                </div>

                {/* Debit Rules Column */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                        Debit Rules
                    </h2>
                    <div className="space-y-2">
                        {debitRules.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">No active debit rules.</p>
                        ) : (
                            debitRules.map(renderRuleItem)
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold mb-1">Advanced Rules Guide:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Rules set to <strong>"Credit & Debit"</strong> appear in both lists.</li>
                            <li><strong>Deleting Transactions:</strong> To remove unwanted transactions, create a rule like <em>"Delete transactions under $1"</em>.</li>
                            <li><strong>Renaming:</strong> Use instructions like <em>"Rename 'Uber *Trip' to 'Uber Ride'"</em>.</li>
                            <li><strong>Context:</strong> Rules can use amounts and dates (e.g., <em>"First transaction of month is Rent"</em>).</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Rules;
