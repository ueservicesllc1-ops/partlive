import { apiFetch } from './apiClient';

export interface SendGiftRequest {
  roomId: string;
  receiverId: string;
  giftId: string;
  quantity: number;
}

export const giftApi = {
  sendRoomGift: async (data: SendGiftRequest): Promise<any> => {
    return apiFetch('/gifts/room/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
