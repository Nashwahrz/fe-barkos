import { API_BASE_URL } from './constants';

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

  // Ensure URL is constructed correctly without double slashes
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important for Sanctum/CORS sessions
  });

  // Handle non-JSON responses (like 204 No Content or server errors)
  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    throw new Error(data.message || `Error: ${response.status} ${response.statusText}`);
  }

  return data;
}

export function getStorageUrl(path: string | null) {
  if (!path) return null;
  
  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;
  
  const baseUrl = API_BASE_URL.replace('/api', '');
  
  // Clean up the path to ensure it doesn't have double /storage
  let cleanPath = path;
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }
  
  return `${baseUrl}/${cleanPath}`;
}
