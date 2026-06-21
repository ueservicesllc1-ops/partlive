import { API_BASE_URL } from '../services/api/apiClient';

// LiveKit WebRTC server configuration
// Token server uses the same production backend as all other API calls
export const LIVEKIT_CONFIG = {
  // LiveKit Cloud WebSocket URL
  LIVEKIT_WS_URL: 'wss://partylive-0bhcjwz0.livekit.cloud',
  // Token server: uses API_BASE_URL which points to Railway in production
  // Falls back to local dev server IP for local testing
  get LIVEKIT_TOKEN_SERVER_URL() {
    return `${API_BASE_URL}/livekit/token`;
  },
};
