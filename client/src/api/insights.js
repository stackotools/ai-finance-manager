import api from './axios';

export const getInsights = (month) => api.get('/insights', { params: { month } }).then(r => r.data.data);
export const regenerateInsights = (month) => api.post('/insights/regenerate', null, { params: { month } }).then(r => r.data.data);
export const getPrediction = () => api.get('/insights/prediction').then(r => r.data.data);
export const getBudgets = (month) => api.get('/budgets', { params: { month } }).then(r => r.data.data);
export const recommendBudgets = () => api.post('/budgets/recommend').then(r => r.data.data);
export const saveBudgets = (data) => api.put('/budgets', data).then(r => r.data.data);
