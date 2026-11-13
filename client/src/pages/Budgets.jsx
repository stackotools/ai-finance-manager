import React, { useState, useEffect } from 'react';
import { getBudgets, recommendBudgets, saveBudgets } from '../api/insights';
import { getCategories } from '../api/categories';
import { toast } from 'react-hot-toast';
import { PieChart, Calendar, Plus, BrainCircuit, Edit2, Check, X, AlertTriangle } from 'lucide-react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import { formatCurrency, getMonthString, classNames } from '../utils/formatters';

export default function Budgets() {
  const [month, setMonth] = useState(getMonthString(new Date()));
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Add new budget state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editLimit, setEditLimit] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [budgetData, catData] = await Promise.all([
        getBudgets(month).catch(() => []),
        getCategories().catch(() => [])
      ]);
      setBudgets(budgetData || []);
      setCategories(catData.filter(c => c.type === 'expense') || []);
    } catch (err) {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  const handleSaveBudget = async (categoryId, limit) => {
    try {
      setSaving(true);
      const payload = {
        month,
        budgets: [
          ...budgets.filter(b => b.category._id !== categoryId && b.category.id !== categoryId).map(b => ({
            category: b.category._id || b.category.id,
            limit: b.limit
          })),
          { category: categoryId, limit: Number(limit) }
        ]
      };
      
      await saveBudgets(payload);
      toast.success('Budget saved successfully');
      setEditingId(null);
      setShowAddForm(false);
      setNewBudgetCategory('');
      setNewBudgetLimit('');
      fetchData();
    } catch (err) {
      toast.error('Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyAiRecommendations = async () => {
    try {
      setLoading(true);
      const data = await recommendBudgets();
      if (data && data.recommendations) {
        // format for save
        const payload = {
          month,
          budgets: data.recommendations.map(r => ({
            category: r.categoryId,
            limit: r.limit
          }))
        };
        await saveBudgets(payload);
        toast.success('AI recommendations applied');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to get recommendations');
      setLoading(false);
    }
  };

  if (loading && budgets.length === 0) return <div className="p-8"><Loader /></div>;

  const totalBudget = budgets.reduce((acc, curr) => acc + curr.limit, 0);
  const totalSpent = budgets.reduce((acc, curr) => acc + (curr.spent || 0), 0);
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  const getProgressColor = (percent) => {
    if (percent < 80) return 'bg-green-500';
    if (percent < 100) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PieChart className="text-blue-600" />
          Budgets
        </h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleApplyAiRecommendations}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
          >
            <BrainCircuit size={16} />
            <span>AI Recommendations</span>
          </button>

          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            <Calendar size={18} className="text-gray-500" />
            <input 
              type="month" 
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="outline-none text-sm font-medium bg-transparent"
            />
          </div>
        </div>
      </div>

      {budgets.length > 0 && (
        <Card className="bg-gray-900 text-white">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4">
            <div>
              <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Monthly Budget</h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold">{formatCurrency(totalSpent)}</span>
                <span className="text-gray-400">/ {formatCurrency(totalBudget)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xl font-bold ${totalPercentage > 100 ? 'text-red-400' : 'text-green-400'}`}>
                {totalPercentage.toFixed(1)}%
              </span>
              <span className="text-gray-400 ml-2">used</span>
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${totalPercentage > 100 ? 'bg-red-500' : 'bg-green-500'}`} 
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>
        </Card>
      )}

      <div className="flex justify-between items-center mt-8 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Category Budgets</h2>
        {!showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <Plus size={16} /> <span>Add Category Budget</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <h3 className="text-sm font-medium text-blue-900 mb-3">Add New Budget</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                value={newBudgetCategory}
                onChange={e => setNewBudgetCategory(e.target.value)}
              >
                <option value="">Select a category...</option>
                {categories.filter(c => !budgets.find(b => (b.category._id || b.category.id) === (c._id || c.id))).map(c => (
                  <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Limit (₹)</label>
              <input
                type="number"
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                value={newBudgetLimit}
                onChange={e => setNewBudgetLimit(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button 
                onClick={() => handleSaveBudget(newBudgetCategory, newBudgetLimit)}
                disabled={!newBudgetCategory || !newBudgetLimit || saving}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
              <button 
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {budgets.length === 0 && !showAddForm ? (
        <EmptyState 
          icon={PieChart} 
          title="No budgets set" 
          description="Create budgets for your expense categories to keep your spending in check."
          action={
            <button 
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Create First Budget
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const categoryId = budget.category._id || budget.category.id;
            const isEditing = editingId === categoryId;
            const spent = budget.spent || 0;
            const limit = budget.limit;
            const percent = limit > 0 ? (spent / limit) * 100 : 0;

            return (
              <Card key={categoryId} className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: budget.category.color || '#9ca3af' }}
                    />
                    <h4 className="font-semibold text-gray-900">{budget.category.name}</h4>
                  </div>
                  {!isEditing ? (
                    <button 
                      onClick={() => { setEditingId(categoryId); setEditLimit(limit.toString()); }}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 size={16} />
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <button onClick={() => handleSaveBudget(categoryId, editLimit)} className="text-green-600 p-1 hover:bg-green-50 rounded">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-red-600 p-1 hover:bg-red-50 rounded">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1">Update Limit Amount</label>
                    <input 
                      type="number" 
                      value={editLimit}
                      onChange={(e) => setEditLimit(e.target.value)}
                      className="w-full p-2 border border-blue-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">{formatCurrency(spent)}</span>
                      <span className="text-gray-500 ml-1">of {formatCurrency(limit)}</span>
                    </div>
                    <span className={`text-xs font-bold ${percent > 100 ? 'text-red-600' : 'text-gray-700'}`}>
                      {percent.toFixed(1)}%
                    </span>
                  </div>
                )}

                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(percent)}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                
                {percent >= 100 && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> Budget exceeded!
                  </p>
                )}
                {percent >= 80 && percent < 100 && (
                  <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                    Nearing budget limit.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
