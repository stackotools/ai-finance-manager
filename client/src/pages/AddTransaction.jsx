import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import Card from '../components/Card';
import { formatDateForInput } from '../utils/formatters';
import { createTransaction, updateTransaction, getTransaction, suggestCategory } from '../api/transactions';
import { getCategories } from '../api/categories';
import toast from 'react-hot-toast';

const AddTransaction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [editData, setEditData] = useState(location.state?.transaction || null);
  const isEditing = !!(editData || id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    amount: editData?.amount || '',
    type: editData?.type || 'expense',
    date: editData?.date ? formatDateForInput(editData.date) : formatDateForInput(new Date()),
    note: editData?.note || '',
    category: editData?.category?._id || editData?.category?.id || editData?.category || '',
    categorySource: editData?.categorySource || 'manual'
  });

  const [errors, setErrors] = useState({});
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Fetch transaction if navigated directly by ID
  useEffect(() => {
    if (id && !editData) {
      const fetchTx = async () => {
        try {
          setFetching(true);
          const data = await getTransaction(id);
          if (data) {
            setEditData(data);
            setFormData({
              amount: data.amount || '',
              type: data.type || 'expense',
              date: data.date ? formatDateForInput(data.date) : formatDateForInput(new Date()),
              note: data.note || '',
              category: data.category?._id || data.category?.id || data.category || '',
              categorySource: data.categorySource || 'manual'
            });
          }
        } catch (err) {
          toast.error('Failed to load transaction details');
        } finally {
          setFetching(false);
        }
      };
      fetchTx();
    }
  }, [id]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  // Debounce for auto-categorization
  useEffect(() => {
    if (isEditing || !formData.note || formData.note.length < 3) return;

    const timer = setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const res = await suggestCategory(formData.note, formData.type);
        const suggestedId = res?.categoryId || res?.data?.categoryId || res?.category?._id || res?.data?.category?._id;
        if (suggestedId) {
          setFormData(prev => ({
            ...prev,
            category: suggestedId,
            categorySource: 'rule'
          }));
          toast.success('Category auto-suggested!');
        }
      } catch (err) {
        // silently fail for auto-suggest
        console.error(err);
      } finally {
        setIsSuggesting(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.note, formData.type, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // If user manually changes category, mark as manual
      ...(name === 'category' ? { categorySource: 'manual' } : {})
    }));
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selected = new Date(formData.date);
      const now = new Date();
      if (selected > now) {
        newErrors.date = 'Date cannot be in the future';
      }
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.note) {
      newErrors.note = 'Description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const targetId = editData?._id || editData?.id || id;
      if (isEditing && targetId) {
        await updateTransaction(targetId, formData);
        toast.success('Transaction updated');
      } else {
        await createTransaction(formData);
        toast.success('Transaction added');
      }
      navigate('/transactions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories by type
  const typeCategories = categories.filter(c => c.type === formData.type);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Transaction' : 'Add Transaction'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEditing ? 'Update transaction details' : 'Enter a new income or expense'}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex bg-gray-100 p-1 rounded-md">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'expense' }})}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md text-center focus:outline-none ${
                  formData.type === 'expense' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'income' }})}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md text-center focus:outline-none ${
                  formData.type === 'income' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (₹)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  className={`focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm rounded-md ${errors.amount ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="mt-2 text-sm text-red-600">{errors.amount}</p>}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
              <div className="mt-1">
                <input
                  type="date"
                  name="date"
                  id="date"
                  max={formatDateForInput(new Date())}
                  value={formData.date}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-md ${errors.date ? 'border-red-300' : 'border-gray-300'}`}
                />
              </div>
              {errors.date && <p className="mt-2 text-sm text-red-600">{errors.date}</p>}
            </div>

            {/* Note/Description */}
            <div className="sm:col-span-2">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 flex justify-between">
                <span>Description</span>
                <span className="text-gray-400">{formData.note.length}/200</span>
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  name="note"
                  id="note"
                  maxLength="200"
                  value={formData.note}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-md ${errors.note ? 'border-red-300' : 'border-gray-300'} ${isSuggesting ? 'pr-10' : ''}`}
                  placeholder="e.g., Grocery shopping at Walmart"
                />
                {isSuggesting && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                  </div>
                )}
              </div>
              {errors.note && <p className="mt-2 text-sm text-red-600">{errors.note}</p>}
            </div>

            {/* Category */}
            <div className="sm:col-span-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 flex justify-between">
                <span>Category</span>
                {formData.categorySource === 'auto' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                    Auto-suggested
                  </span>
                )}
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm rounded-md ${errors.category ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option value="">Select a category</option>
                  {typeCategories.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {errors.category && <p className="mt-2 text-sm text-red-600">{errors.category}</p>}
            </div>
          </div>

          <div className="pt-5 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/transactions')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddTransaction;
