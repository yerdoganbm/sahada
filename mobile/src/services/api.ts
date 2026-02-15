/**
 * Mobil API Client
 * Axios instance - baseURL ve auth header ile merkezi istekler
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Geliştirme: localhost (emulator 10.0.2.2 Android, 127.0.0.1 iOS)
// Production: kendi API adresiniz
const API_BASE_URL =
  typeof __DEV__ !== 'undefined' && __DEV__
    ? 'http://localhost:3001/api'
    : 'https://api.yourdomain.com/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Giriş yapmış kullanıcı id'si - isteklerde header'a eklenir */
let authUserId: string | null = null;

export function setApiAuthUserId(userId: string | null) {
  authUserId = userId;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (authUserId) {
    config.headers['X-User-Id'] = authUserId;
    // İleride token kullanılırsa: config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // İsteğe bağlı: global logout tetiklenebilir
    }
    return Promise.reject(error);
  }
);

export default api;
