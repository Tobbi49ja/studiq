import axios from 'axios';
import { get } from 'svelte/store';
import { token, clearAuth } from '../stores/auth.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 120000
});

api.interceptors.request.use((config) => {
  const t = get(token);
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function apiError(error) {
  return error?.response?.data?.error || error?.message || 'Something went wrong';
}
