import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Full analysis — returns strength, duplicates, and AI recommendations.
 * @param {string} code
 * @param {string} language
 */
export const analyzeCode = async (code, language = 'python') => {
  const response = await api.post('/analyze/', { code, language });
  return response.data;
};

/**
 * Strength score only.
 */
export const getStrength = async (code, language = 'python') => {
  const response = await api.post('/strength/', { code, language });
  return response.data;
};

/**
 * Duplicates only.
 */
export const getDuplicates = async (code, language = 'python') => {
  const response = await api.post('/duplicates/', { code, language });
  return response.data;
};

/**
 * Health check.
 */
export const healthCheck = async () => {
  const response = await api.get('/health/');
  return response.data;
};

export default api;
