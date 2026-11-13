import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory, recategorize } from '../api/categories';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Tag, RefreshCw, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { classNames } from '../utils/formatters';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', 
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Modal Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#3b82f6',
    icon: 'Tag',
    keywords: []
  });
  const [keywordInput, setKeywordInput] = useState('');

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [reassignTo, setReassignTo] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color || '#3b82f6',
        icon: category.icon || 'Tag',
        keywords: category.keywords || []
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        type: 'expense',
        color: '#3b82f6',
        icon: 'Tag',
        keywords: []
      });
    }
    setKeywordInput('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      if (!formData.keywords.includes(keywordInput.trim().toLowerCase())) {
        setFormData(prev => ({
          ...prev,
          keywords: [...prev.keywords, keywordInput.trim().toLowerCase()]
        }));
      }
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keywordToRemove)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory._id || editingCategory.id, formData);
        toast.success('Category updated successfully');
      } else {
        await createCategory(formData);
        toast.success('Category created successfully');
      }
      handleCloseModal();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setReassignTo('');
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCategory(categoryToDelete._id || categoryToDelete.id, reassignTo || undefined);
      toast.success('Category deleted successfully');
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleRecategorize = async () => {
    try {
      const result = await recategorize();
      toast.success(`${result.message || 'Transactions re-categorized'}`);
    } catch (err) {
      toast.error('Failed to re-categorize transactions');
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>;

  const expenses = categories.filter(c => c.type === 'expense');
  const incomes = categories.filter(c => c.type === 'income');

  const renderCategoryGroup = (title, items) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(category => (
          <Card key={category._id || category.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: category.color || '#ccc' }} 
                />
                <h3 className="font-medium text-gray-900">{category.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleOpenModal(category)} className="text-gray-400 hover:text-blue-600 transition-colors">
                  <Edit2 size={16} />
                </button>
                {!category.isDefault && (
                  <button onClick={() => handleDeleteClick(category)} className="text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-3">
              {category.isDefault && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md font-medium border border-gray-200">
                  System Default
                </span>
              )}
              <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md">
                {category.keywords?.length || 0} keywords
              </span>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-full">
            <EmptyState title={`No ${title.toLowerCase()}`} description={`Add a new ${title.toLowerCase().slice(0, -1)} category to get started.`} />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleRecategorize}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
            <span>Re-categorize</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {renderCategoryGroup('Expenses', expenses)}
      {renderCategoryGroup('Income', incomes)}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal} />
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {editingCategory ? 'Edit Category' : 'Add Category'}
                  </h3>
                  <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      required
                      disabled={editingCategory?.isDefault}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      disabled={editingCategory?.isDefault}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>

                  {!editingCategory?.isDefault && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                      <div className="grid grid-cols-8 gap-2">
                        {COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            className={classNames(
                              "w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                              formData.color === c ? 'ring-2 ring-offset-2 ring-gray-900' : ''
                            )}
                            style={{ backgroundColor: c }}
                            onClick={() => setFormData({...formData, color: c})}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Keywords (Press Enter to add)</label>
                    <div className="mt-1 p-2 border border-gray-300 rounded-md flex flex-wrap gap-2 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                      {formData.keywords.map(kw => (
                        <span key={kw} className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                          {kw}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(kw)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
                        placeholder="Add keyword..."
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                        onKeyDown={handleAddKeyword}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
                    >
                      Save Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmOpen && (
        <ConfirmDialog
          title="Delete Category"
          message={
            <div>
              <p className="mb-4">Are you sure you want to delete <strong>{categoryToDelete?.name}</strong>? This action cannot be undone.</p>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reassign transactions to (Optional)
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={reassignTo}
                  onChange={e => setReassignTo(e.target.value)}
                >
                  <option value="">-- Don't reassign (leave uncategorized) --</option>
                  {categories
                    .filter(c => c._id !== categoryToDelete?._id && c.id !== categoryToDelete?.id && c.type === categoryToDelete?.type)
                    .map(c => (
                      <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>
          }
          confirmText="Delete Category"
          cancelText="Cancel"
          danger={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );
}
