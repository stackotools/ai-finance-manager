export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
export const CURRENCY_SYMBOL = '₹';
export const DATE_FORMAT = 'DD/MM/YYYY';

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer'
};

export const CATEGORY_SOURCES = {
  SYSTEM: 'system',
  USER: 'user'
};
