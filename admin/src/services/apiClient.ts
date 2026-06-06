import { auth } from '../lib/firebase';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export const apiClient = async (endpoint: string, options: RequestOptions = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  
  if (options.params) {
    Object.keys(options.params).forEach((key) =>
      url.searchParams.append(key, options.params![key])
    );
  }

  // Get current user ID token
  const user = auth.currentUser;
  const token = user ? await user.getIdToken(true) : null;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = { error: 'Unknown API error' };
    try {
      errorData = await response.json();
    } catch (e) {
      // Non-JSON response
    }
    
    if (response.status === 401 || response.status === 403) {
      console.warn('API Authentication/Authorization error:', errorData);
    }
    
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const api = {
  get: (endpoint: string, options?: RequestOptions) =>
    apiClient(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, body?: any, options?: RequestOptions) =>
    apiClient(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint: string, body?: any, options?: RequestOptions) =>
    apiClient(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string, options?: RequestOptions) =>
    apiClient(endpoint, { ...options, method: 'DELETE' }),
};
