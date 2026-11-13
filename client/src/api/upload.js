import api from './axios';

export const parseFile = (formData) => api.post('/upload/parse', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data.data);

export const importTransactions = (data) => api.post('/upload/import', data).then(r => r.data.data);
