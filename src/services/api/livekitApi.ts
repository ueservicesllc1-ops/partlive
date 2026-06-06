import auth from '@react-native-firebase/auth';
import { LIVEKIT_CONFIG } from '../../config/livekit';

export interface LiveKitTokenResponse {
  token: string;
  url: string;
  roomName: string;
  identity: string;
  canPublish: boolean;
  expiresIn: number;
}

export const getLiveKitRoomToken = async (roomId: string): Promise<LiveKitTokenResponse> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  // Fetch Firebase ID Token
  const idToken = await currentUser.getIdToken();

  const response = await fetch(LIVEKIT_CONFIG.LIVEKIT_TOKEN_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ roomId }),
  });

  if (!response.ok) {
    let errorMsg = 'Error al obtener token de voz';
    try {
      const data = await response.json() as any;
      errorMsg = data?.error || errorMsg;
    } catch (e) {}

    if (response.status === 401 || response.status === 403) {
      throw new Error(`Permisos insuficientes: ${errorMsg}`);
    } else if (response.status === 404) {
      throw new Error('La sala de voz no existe.');
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<LiveKitTokenResponse>;
};

export const getLiveKitLiveToken = async (liveId: string): Promise<LiveKitTokenResponse> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  const idToken = await currentUser.getIdToken();

  const response = await fetch(LIVEKIT_CONFIG.LIVEKIT_TOKEN_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ liveId }),
  });

  if (!response.ok) {
    let errorMsg = 'Error al obtener token de video';
    try {
      const data = await response.json() as any;
      errorMsg = data?.error || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  return response.json() as Promise<LiveKitTokenResponse>;
};

