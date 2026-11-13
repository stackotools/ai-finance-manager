import api from './axios';

export const getTransactions = (params) => api.get('/transactions', { params }).then(r => {
  const payload = r.data?.data || r.data || {};
  const list = payload.transactions || (Array.isArray(payload) ? payload : []);
  return {
    transactions: list,
    pagination: payload.pagination || { total: list.length, pages: 1, page: 1, limit: 20 },
    data: list // backward compatibility
  };
});

export const getTransaction = (id) => api.get(`/transactions/${id}`).then(r => r.data?.data || r.data);
export const createTransaction = (data) => api.post('/transactions', data).then(r => r.data?.data || r.data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data).then(r => r.data?.data || r.data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`).then(r => r.data);
export const deleteAllTransactions = () => api.delete('/transactions').then(r => r.data);
export const suggestCategory = (note, type) => api.post('/transactions/categorize', { note, type }).then(r => r.data?.data || r.data);
