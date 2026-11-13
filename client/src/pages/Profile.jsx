import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { User, Mail, IndianRupee, Save, Shield, Trash2, AlertTriangle } from 'lucide-react';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import { deleteAllTransactions } from '../api/transactions';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMonthlyIncome(user.monthlyIncome?.toString() || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile({
        name: name.trim(),
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = async () => {
    try {
      setClearing(true);
      const res = await deleteAllTransactions();
      toast.success(res?.message || 'All transactions cleared');
      setConfirmClear(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear transactions');
    } finally {
      setClearing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <User className="text-indigo-600" />
        Profile & Settings
      </h1>

      {/* Account Info */}
      <Card>
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-600">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Mail size={14} /> {user.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-10"
                placeholder="Your name"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Income (₹)
            </label>
            <p className="text-xs text-gray-500 mb-2">Used for budget recommendations (50/30/20 rule).</p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IndianRupee className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="monthlyIncome"
                type="number"
                min="0"
                step="100"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="input-field pl-10"
                placeholder="e.g. 75000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </Card>

      {/* Security Info */}
      <Card>
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Shield size={18} className="text-green-600" />
          Account Security
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span>Email</span>
            <span className="font-medium text-gray-900">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span>Account created</span>
            <span className="font-medium text-gray-900">
              {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span>Authentication</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              JWT Token Active
            </span>
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="border-red-200">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-2">
          <AlertTriangle size={18} className="text-red-600" />
          Data Management
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Remove all transactions from your account. Use this to clear old or sample data before importing a fresh bank statement.
          This action cannot be undone.
        </p>
        <button
          onClick={() => setConfirmClear(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 text-red-700 bg-white hover:bg-red-50 text-sm font-medium transition-colors"
        >
          <Trash2 size={16} />
          Clear All Transactions
        </button>
      </Card>

      <ConfirmDialog
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearData}
        title="Clear all transactions"
        message="This will permanently delete every transaction in your account (including any old sample data). Your categories, budgets and profile will remain. Continue?"
        confirmText="Yes, delete all"
        isDestructive
        isLoading={clearing}
      />
    </div>
  );
}
