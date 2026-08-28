import axios from 'axios';
import { get } from 'svelte/store';
import { token, clearAuth } from '../stores/auth.js';
import { isOnline } from '../stores/network.js';

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

const RETRY_DELAY_MS = [1000, 2000, 4000];

export async function withRetry(fn, options = {}) {
  const { retries = 3, retryOnNetworkOnly = false } = options;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      const is5xx = err.response && err.response.status >= 500;
      const is4xx = err.response && err.response.status >= 400 && err.response.status < 500;

      if (is4xx || (retryOnNetworkOnly && !isNetworkError)) {
        throw err;
      }

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS[attempt] || 4000));
      }
    }
  }
  throw lastError;
}

export function apiError(error) {
  if (!error.response) {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return 'No internet connection — please check your network';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out — please try again';
    }
  }
  return error?.response?.data?.error || error?.message || 'Something went wrong';
}

export function isNetworkError(error) {
  return !error.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error';
}

export function isServerError(error) {
  return error.response && error.response.status >= 500;
}
