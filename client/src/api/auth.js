import api from './axios';

export const login = (email, password) => api.post('/auth/login', { email, password }).then(r => r.data.data);
export const signup = (name, email, password) => api.post('/auth/signup', { name, email, password }).then(r => r.data.data);
export const getMe = () => api.get('/auth/me').then(r => r.data.data);
export const updateProfile = (data) => api.patch('/auth/me', data).then(r => r.data.data);
export const logout = () => api.post('/auth/logout').catch(() => { /* graceful if server unreachable */ });
