import { API_BASE_URL } from './constants';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err) {
    throw new Error('Server sedang bermasalah. Silakan coba lagi beberapa saat lagi.');
  }

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    const error = new Error(data.message || `Error: ${response.status} ${response.statusText}`);
    (error as any).status = response.status;
    (error as any).info = data;
    throw error;
  }

  return data;
}

/**
 * Fetcher function for SWR
 */
export const swrFetcher = (endpoint: string) => fetchApi(endpoint);

export function getStorageUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
  let cleanPath = path;
  
  // If backend returns /storage/xxx (from Storage::url), fix it to /api/storage/xxx
  if (cleanPath.startsWith('/storage/')) {
    cleanPath = '/api' + cleanPath;
  }

  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }
  
  return `${baseUrl}/${cleanPath}`;
}

/**
 * Push Notification Helpers
 */
export async function subscribeToPushNotifications(subscription: PushSubscription) {
  const subJson = subscription.toJSON();
  return fetchApi('/push-subscribe', {
    method: 'POST',
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: subJson.keys,
    }),
  });
}

export async function unsubscribeFromPushNotifications(endpoint: string) {
  return fetchApi('/push-unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ endpoint }),
  });
}
