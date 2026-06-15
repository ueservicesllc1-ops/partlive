import { apiFetch } from './apiClient';

export interface StartSessionResponse {
  success: boolean;
  sessionId: string;
}

export interface GenericResponse {
  success: boolean;
}

export const sessionApi = {
  startSession: async (params: {
    platform: string;
    appVersion?: string;
    country?: string;
    language?: string;
    deviceId?: string;
  }): Promise<StartSessionResponse> => {
    return apiFetch('/sessions/start', {
      method: 'POST',
      body: JSON.stringify(params),
    }) as Promise<StartSessionResponse>;
  },

  sendHeartbeat: async (sessionId: string): Promise<GenericResponse> => {
    return apiFetch('/sessions/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }) as Promise<GenericResponse>;
  },

  endSession: async (sessionId: string): Promise<GenericResponse> => {
    return apiFetch('/sessions/end', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }) as Promise<GenericResponse>;
  },
};
