import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import CategoryBadge from '../components/CategoryBadge';
import { formatCurrency, formatDate, formatDateForInput } from '../utils/formatters';
import { getTransactions, deleteTransaction, updateTransaction, deleteAllTransactions } from '../api/transactions';
import toast from 'react-hot-toast';
import { getCategories } from '../api/categories';

const Transactions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const monthParam = searchParams.get('month');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 15;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [filters, setFilters] = useState({
    type: 'all', // all, income, expense
    category: categoryParam || 'all',
    month: monthParam || '',
    startDate: '',
    endDate: '',
    sort: '-date' // -date, date, -amount, amount
  });

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync category & month params from URL if present
  useEffect(() => {
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
      setPage(1);
    }
    if (monthParam) {
      setFilters(prev => ({ ...prev, month: monthParam }));
      setPage(1);
    }
  }, [categoryParam, monthParam]);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit,
        sort: filters.sort
      };
      
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.month) params.month = filters.month;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await getTransactions(params);
      const list = res?.transactions || res?.data || (Array.isArray(res) ? res : []);
      setTransactions(Array.isArray(list) ? list : []);
      setTotalPages(res?.pagination?.pages || 1);
      setTotalItems(res?.pagination?.total || (Array.isArray(list) ? list.length : 0));
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filters]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to page 1 on filter change
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      category: 'all',
      month: '',
      startDate: '',
      endDate: '',
      sort: '-date'
    });
    setSearchTerm('');
    setPage(1);
    navigate('/transactions');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await deleteTransaction(deleteId);
      toast.success('Transaction deleted');
      setDeleteId(null);
      fetchTransactions();
    } catch (err) {
      toast.error('Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setIsClearingAll(true);
      await deleteAllTransactions();
      toast.success('All transactions cleared successfully');
      setShowClearAllDialog(false);
      fetchTransactions();
    } catch (err) {
      toast.error('Failed to clear transactions');
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleInlineCategoryChange = async (txId, newCategoryId) => {
    try {
      await updateTransaction(txId, { category: newCategoryId });
      toast.success('Category updated');
      fetchTransactions();
    } catch (err) {
      toast.error('Failed to update category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Transactions
            {filters.month && (
              <span className="text-xs font-normal text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                Month: {filters.month}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage your income and expenses ({totalItems} total)</p>
        </div>
        <div className="flex items-center space-x-3">
          {totalItems > 0 && (
            <button
              onClick={() => setShowClearAllDialog(true)}
              className="inline-flex items-center justify-center px-3 py-2 border border-red-200 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="-ml-1 mr-1.5 h-4 w-4 text-red-500" />
              Clear All Data
            </button>
          )}
          <Link
            to="/transactions/new"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Transaction
          </Link>
        </div>
      </div>

      <Card className="p-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 min-w-0 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search note..."
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
              ))}
            </select>
            
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="-date">Newest First</option>
              <option value="date">Oldest First</option>
              <option value="-amount">Amount High→Low</option>
              <option value="amount">Amount Low→High</option>
            </select>
            
            <button 
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="mr-2 h-4 w-4" /> Clear
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex justify-center"><Loader /></div>
        ) : error ? (
          <ErrorBox message={error} onRetry={fetchTransactions} />
        ) : transactions.length === 0 ? (
          <EmptyState 
            title="No transactions found" 
            description="Try adjusting your filters or add a new transaction." 
            action={{ label: 'Add Transaction', href: '/transactions/new' }} 
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx._id || tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {tx.note}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <CategoryBadge category={tx.category} source={tx.categorySource} />
                          <select
                            value={tx.category?._id || tx.category?.id || tx.category || ''}
                            onChange={(e) => handleInlineCategoryChange(tx._id || tx.id, e.target.value)}
                            className="text-xs border-gray-200 rounded py-0.5 px-1 bg-white hover:bg-gray-50 text-gray-600 focus:ring-1 focus:ring-indigo-500 border cursor-pointer"
                            title="Quick change category"
                          >
                            <option value="" disabled>Change...</option>
                            {categories.filter(c => c.type === tx.type).map(c => (
                              <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate('/transactions/new', { state: { transaction: tx } })}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(tx._id || tx.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalItems)}</span> of <span className="font-medium">{totalItems}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={showClearAllDialog}
        onClose={() => setShowClearAllDialog(false)}
        onConfirm={handleClearAll}
        title="Clear All Transactions"
        message="Are you sure you want to delete ALL transactions from your account? This action cannot be undone and will reset your dashboard."
        confirmText="Yes, Clear All"
        isDestructive={true}
        isLoading={isClearingAll}
      />
    </div>
  );
};

export default Transactions;
