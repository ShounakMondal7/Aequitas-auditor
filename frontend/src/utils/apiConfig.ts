/**
 * Resolves the backend API base URL with fallback for local dev.
 * Dynamically handles VITE_API_URL environment variable from Vite.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string') {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:5000/api'
    : '/api';
}

export const API_BASE_URL = getApiBaseUrl();
