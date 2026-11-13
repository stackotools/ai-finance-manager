import React, { useState, useEffect } from 'react';
import { getInsights, regenerateInsights, getPrediction } from '../api/insights';
import { recommendBudgets, saveBudgets } from '../api/insights';
import { toast } from 'react-hot-toast';
import { BrainCircuit, Lightbulb, AlertTriangle, TrendingUp, TrendingDown, Info, Calendar } from 'lucide-react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import ErrorBox from '../components/ErrorBox';
import { formatCurrency, getMonthString, formatMonth } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Insights() {
  const [month, setMonth] = useState(getMonthString(new Date()));
  const [insights, setInsights] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [recommendedBudgets, setRecommendedBudgets] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [insightsData, predData, budgetData] = await Promise.all([
        getInsights(month).catch(() => null),
        getPrediction().catch(() => null),
        recommendBudgets().catch(() => null)
      ]);
      setInsights(insightsData);
      setPrediction(predData);
      setRecommendedBudgets(budgetData);
    } catch (err) {
      setError('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  const handleRegenerate = async () => {
    try {
      setGenerating(true);
      const data = await regenerateInsights(month);
      setInsights(data);
      toast.success('Insights regenerated successfully');
    } catch (err) {
      toast.error('Failed to regenerate insights');
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyBudgets = async () => {
    if (!recommendedBudgets || !recommendedBudgets.recommendations) return;
    try {
      // transform format for saveBudgets API if needed
      // assuming recommendations array has { categoryId, limit }
      await saveBudgets({ month, budgets: recommendedBudgets.recommendations.map(r => ({ category: r.categoryId, limit: r.limit })) });
      toast.success('Budgets applied successfully');
    } catch (err) {
      toast.error('Failed to apply recommended budgets');
    }
  };

  const renderInsightIcon = (type) => {
    switch(type) {
      case 'positive': return <TrendingDown className="text-green-500" size={24} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={24} />;
      default: return <Info className="text-blue-500" size={24} />;
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader /></div>;
  if (error) return <div className="p-4"><ErrorBox message={error} onRetry={fetchData} /></div>;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BrainCircuit className="text-purple-600" />
          AI Insights
        </h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Insights Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Analysis for {formatMonth(month)}</h2>
              <button 
                onClick={handleRegenerate}
                disabled={generating}
                className="text-sm px-4 py-2 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {generating ? <Loader size="small" /> : <BrainCircuit size={16} />}
                {generating ? 'Analyzing...' : 'Regenerate'}
              </button>
            </div>

            {(insights?.insights || insights?.items) && (insights.insights || insights.items).length > 0 ? (
              <div className="space-y-4">
                {(insights.insights || insights.items).map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="flex-shrink-0 mt-1">
                      {renderInsightIcon(item.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{item.detail || item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No insights generated for this month.</p>
                <button onClick={handleRegenerate} className="mt-4 text-purple-600 font-medium hover:underline">
                  Generate Analysis
                </button>
              </div>
            )}
          </Card>

          {/* Actionable Tips */}
          {insights?.tips && insights.tips.length > 0 && (
            <Card title="Actionable Recommendations" className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
              <ul className="space-y-3">
                {insights.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <span className="text-sm text-gray-800">{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Sidebar panels */}
        <div className="space-y-6">
          {/* Prediction Panel */}
          <Card title="Next Month Prediction">
            {prediction ? (
              <div>
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-500 mb-1">Predicted Expenses</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(prediction.totalPredicted ?? prediction.totalPredictedExpense ?? prediction.total ?? 0)}</p>
                  <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    prediction.confidence === 'high' ? 'bg-green-100 text-green-800' :
                    prediction.confidence === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {((prediction.confidence || 'medium').charAt(0).toUpperCase() + (prediction.confidence || 'medium').slice(1))} Confidence
                  </div>
                </div>

                {((prediction.byCategory || prediction.categoryPredictions) && (prediction.byCategory || prediction.categoryPredictions).length > 0) && (
                  <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prediction.byCategory || prediction.categoryPredictions} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" textAnchor="end" height={40} tick={{fontSize: 10}} />
                        <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{fontSize: 10}} />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar dataKey="predicted" name="Predicted" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-4 text-center">Based on historical spending patterns.</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Not enough historical data to generate predictions.</p>
            )}
          </Card>

          {/* Budget Recommendations */}
          <Card title="Suggested Budgets">
            {recommendedBudgets?.recommendations && recommendedBudgets.recommendations.length > 0 ? (
              <div>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2 mb-4">
                  {recommendedBudgets.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 truncate mr-2 flex-1">{rec.categoryName}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(rec.limit)}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleApplyBudgets}
                  className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Apply Suggested Budgets
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No budget recommendations available right now.</p>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}
