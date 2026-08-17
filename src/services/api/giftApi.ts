import auth from '@react-native-firebase/auth';

const BACKEND_URL = 'http://localhost:4000'; // Or process.env / API base

export interface SendGiftApiParams {
  targetType: 'live' | 'room' | 'game';
  targetId: string;
  receiverId: string;
  giftId: string;
  quantity: number;
}

/**
 * Sends a gift to a host via secure backend API endpoint /api/gifts/send
 */
export const sendGiftApi = async (params: SendGiftApiParams): Promise<any> => {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('Debes estar autenticado para enviar un regalo.');
  }

  const token = await user.getIdToken();

  const response = await fetch(`${BACKEND_URL}/api/gifts/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error al procesar la transacción del regalo.');
  }

  return data.giftEvent;
};
