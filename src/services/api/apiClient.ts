import auth from '@react-native-firebase/auth';
import { Platform } from 'react-native';

// Production backend on Railway
export const API_BASE_URL = 'https://partlive-production.up.railway.app/api';

export const getAuthToken = async (): Promise<string | null> => {
  const user = auth().currentUser;
  if (!user || user.uid === 'guest_user') return null;
  return await user.getIdToken();
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as any) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null) as any;
    throw new Error(errorData?.error || `API Error: ${response.status}`);
  }

  return response.json();
};
