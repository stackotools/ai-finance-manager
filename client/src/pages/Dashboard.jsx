import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, UploadCloud, Calendar } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import Card from '../components/Card';
import MonthSelector from '../components/MonthSelector';
import CategoryBadge from '../components/CategoryBadge';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate, getMonthString, formatMonth } from '../utils/formatters';
import { getSummary, getCategorySplit, getMonthlyTrend } from '../api/analytics';
import { getTransactions } from '../api/transactions';

const COLORS = ['#EF4444', '#22C55E', '#3B82F6', '#A855F7', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1', '#78716C', '#0EA5E9'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMonth = searchParams.get('month');

  const [selectedMonth, setSelectedMonth] = useState(urlMonth || getMonthString(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    savingsRate: 0,
    transactionCount: 0,
    allTimeCount: 0,
    latestDataMonth: null
  });
  const [categorySplit, setCategorySplit] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Sync if URL month param changes
  useEffect(() => {
    if (urlMonth && urlMonth !== selectedMonth) {
      setSelectedMonth(urlMonth);
    }
  }, [urlMonth]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [summaryRes, splitRes, trendRes, txRes] = await Promise.allSettled([
        getSummary(selectedMonth),
        getCategorySplit(selectedMonth),
        getMonthlyTrend(6, selectedMonth),
        getTransactions({ limit: 5, sort: '-date', month: selectedMonth })
      ]);
      
      const summaryVal = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
      if (summaryVal) {
        setSummary(summaryVal);
      }

      if (splitRes.status === 'fulfilled' && Array.isArray(splitRes.value)) {
        const formattedSplit = splitRes.value.map((item, idx) => ({
          id: item.category?._id,
          name: item.category?.name || 'Other',
          value: item.total || 0,
          color: item.category?.color || COLORS[idx % COLORS.length]
        }));
        setCategorySplit(formattedSplit);
      } else {
        setCategorySplit([]);
      }
      
      if (trendRes.status === 'fulfilled' && Array.isArray(trendRes.value)) {
        setMonthlyTrend(trendRes.value);
      } else {
        setMonthlyTrend([]);
      }
      
      if (txRes.status === 'fulfilled') {
        const txList = txRes.value?.transactions || txRes.value?.data || (Array.isArray(txRes.value) ? txRes.value : []);
        setRecentTransactions(txList);

        // Auto-switch to the month with data if:
        // 1. Current selected month has 0 income & 0 expense
        // 2. No explicit URL month was set by user
        // 3. Transactions exist in the database for another month
        const monthEmpty = !summaryVal || ((summaryVal.totalIncome || 0) === 0 && (summaryVal.totalExpense || 0) === 0);
        const targetMonth = summaryVal?.latestDataMonth || (txList.length > 0 ? getMonthString(txList[0].date) : null);

        if (monthEmpty && targetMonth && targetMonth !== selectedMonth && !urlMonth) {
          setSelectedMonth(targetMonth);
          return; // The state update will re-run fetchDashboardData for targetMonth
        }
      } else {
        setRecentTransactions([]);
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (newMonth) => {
    setSelectedMonth(newMonth);
    setSearchParams({ month: newMonth });
  };

  if (loading && !summary.totalIncome && !summary.totalExpense && recentTransactions.length === 0) {
    return <div className="h-64 flex items-center justify-center"><Loader message="Loading your dashboard..." /></div>;
  }

  if (error && recentTransactions.length === 0) {
    return <ErrorBox message={error} onRetry={fetchDashboardData} />;
  }

  const income = summary?.totalIncome ?? 0;
  const expense = summary?.totalExpense ?? 0;
  const balance = summary?.balance ?? (income - expense);
  const savingsRate = summary?.savingsRate ?? (income > 0 ? Math.max(0, ((income - expense) / income) * 100) : 0);
  const totalUserTxCount = summary?.allTimeCount || recentTransactions.length;
  const monthHasTx = (summary?.transactionCount || 0) > 0 || income > 0 || expense > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your financial activity for <span className="font-semibold text-gray-800">{formatMonth(selectedMonth)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition shadow-sm"
          >
            <UploadCloud className="h-4 w-4 text-indigo-600" />
            Import Bank Statement
          </Link>
          <MonthSelector selectedMonth={selectedMonth} onChange={handleMonthChange} />
        </div>
      </div>

      {/* When user has transactions in DB but the currently selected month is empty */}
      {!monthHasTx && totalUserTxCount > 0 && summary.latestDataMonth && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600 shrink-0" />
            <span>
              No transactions recorded for <strong>{formatMonth(selectedMonth)}</strong>. Your latest transactions are in <strong>{formatMonth(summary.latestDataMonth)}</strong>.
            </span>
          </div>
          <button
            onClick={() => handleMonthChange(summary.latestDataMonth)}
            className="px-3 py-1.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 text-xs shrink-0"
          >
            View {formatMonth(summary.latestDataMonth)}
          </button>
        </div>
      )}

      {/* Onboarding banner only if user has 0 transactions EVER */}
      {totalUserTxCount === 0 && !loading && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-lg">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">No bank transactions recorded yet</h3>
              <p className="text-sm text-gray-600">Upload your bank statement (PDF, CSV, or Excel) to see auto-categorized expenses, analytics, and AI insights.</p>
            </div>
          </div>
          <Link to="/upload" className="btn-primary whitespace-nowrap inline-flex items-center gap-2">
            <UploadCloud className="h-4 w-4" />
            Upload Statement
          </Link>
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center p-5">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 truncate">Total Net Balance</h3>
            <p className={`mt-1 text-2xl font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="p-3 bg-indigo-100 rounded-full">
            <Wallet className="h-6 w-6 text-indigo-600" />
          </div>
        </Card>
        
        <Card className="flex items-center p-5">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 truncate">Total Income ({formatMonth(selectedMonth)})</h3>
            <p className="mt-1 text-2xl font-semibold text-green-600">
              {formatCurrency(income)}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
        </Card>
        
        <Card className="flex items-center p-5">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 truncate">Total Expense ({formatMonth(selectedMonth)})</h3>
            <p className="mt-1 text-2xl font-semibold text-red-600">
              {formatCurrency(expense)}
            </p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <TrendingDown className="h-6 w-6 text-red-600" />
          </div>
        </Card>
        
        <Card className="flex items-center p-5">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 truncate">Savings Rate</h3>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {Number(savingsRate).toFixed(1)}%
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <PiggyBank className="h-6 w-6 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={`Expense by Category (${formatMonth(selectedMonth)})`}>
          <div className="h-80">
            {categorySplit.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySplit}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={95}
                    dataKey="value"
                    nameKey="name"
                    onClick={(entry) => {
                      if (entry?.id && entry.id !== 'uncategorized') {
                        navigate(`/transactions?category=${entry.id}`);
                      }
                    }}
                    cursor="pointer"
                  >
                    {categorySplit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No Expenses" description={`You have no expenses recorded for ${formatMonth(selectedMonth)}.`} icon={TrendingDown} />
            )}
          </div>
        </Card>
        
        <Card title="Income vs Expense Trend (Last 6 Months)">
          <div className="h-80">
            {monthlyTrend.length > 0 && monthlyTrend.some(t => t.income > 0 || t.expense > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="monthLabel" />
                  <YAxis tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No Trend Data" description="Import statement to see historical monthly trends." icon={TrendingUp} />
            )}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card title={`Recent Transactions (${formatMonth(selectedMonth)})`}>
        {loading ? (
          <div className="py-8 flex justify-center"><Loader /></div>
        ) : recentTransactions.length > 0 ? (
          <div className="mt-2 flex flex-col">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Date</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentTransactions.map((tx) => (
                      <tr key={tx._id || tx.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-0">
                          {formatDate(tx.date)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                          {tx.note || 'No note'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <CategoryBadge category={tx.category} />
                        </td>
                        <td className={`whitespace-nowrap px-3 py-4 text-sm font-semibold text-right ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Link to={`/transactions?month=${selectedMonth}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all transactions for {formatMonth(selectedMonth)} &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <EmptyState
            title={`No transactions in ${formatMonth(selectedMonth)}`}
            description={`No transactions found for ${formatMonth(selectedMonth)}. Upload your bank statement or switch months from the selector above.`}
            action={{ label: 'Upload Statement', href: '/upload' }}
          />
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
