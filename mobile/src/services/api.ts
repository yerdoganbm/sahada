/**
 * Mobil API Client
 * fetch tabanlı - React Native/Hermes ile uyumlu (axios crypto/require hatasını önler)
 */

// Geliştirme: localhost (emulator 10.0.2.2 Android, 127.0.0.1 iOS)
// Production: kendi API adresiniz
const API_BASE_URL =
  typeof __DEV__ !== 'undefined' && __DEV__
    ? 'http://localhost:3001/api'
    : 'https://api.yourdomain.com/api';

const DEFAULT_TIMEOUT = 15000;

/** JWT token - varsa Authorization: Bearer ile gonderilir */
let authToken: string | null = null;
/** Giriş yapmış kullanıcı id'si - isteklerde X-User-Id ile gonderilir */
let authUserId: string | null = null;

export function setApiAuthUserId(userId: string | null) {
  authUserId = userId;
}

export function setApiAuthToken(token: string | null) {
  authToken = token;
}

export function getApiAuthToken(): string | null {
  return authToken;
}

/** Token ve userId temizlenir (cikis) */
export function clearApiAuth() {
  authToken = null;
  authUserId = null;
}

/** 401 geldiginde cagrilacak callback (AuthContext logout) */
let onUnauthorized: (() => void) | null = null;
export function setApiOnUnauthorized(cb: (() => void) | null) {
  onUnauthorized = cb;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  if (authUserId) headers['X-User-Id'] = authUserId;
  return headers;
}

function fetchWithTimeout(url: string, init: RequestInit, timeout = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function handleResponse(res: Response) {
  if (res.status === 401) {
    clearApiAuth();
    onUnauthorized?.();
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err: Error & { response?: { status: number; data?: unknown } } = new Error(res.statusText);
    err.response = { status: res.status, data };
    throw err;
  }
  return data;
}

const api = {
  get: (path: string) =>
    fetchWithTimeout(`${API_BASE_URL}${path}`, { headers: buildHeaders() }).then(handleResponse),
  post: (path: string, data?: object) =>
    fetchWithTimeout(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    }).then(handleResponse),
  put: (path: string, data?: object) =>
    fetchWithTimeout(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    }).then(handleResponse),
  delete: (path: string) =>
    fetchWithTimeout(`${API_BASE_URL}${path}`, { method: 'DELETE', headers: buildHeaders() }).then(handleResponse),
};

export { api };
export default api;
