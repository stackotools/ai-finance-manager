import api from './axios';

export const getSummary = (month) => api.get('/analytics/summary', { params: { month } }).then(r => r.data.data);
export const getCategorySplit = (month) => api.get('/analytics/category-split', { params: { month } }).then(r => r.data.data);
export const getMonthlyTrend = (months = 6, month = null) => api.get('/analytics/monthly-trend', { params: { months, ...(month ? { month } : {}) } }).then(r => r.data.data);
