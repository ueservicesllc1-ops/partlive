import { apiFetch } from './apiClient';

/**
 * Mobile moderation API calls for authorized users (e.g. moderators hiding a message)
 * Normal users usually write to Firestore directly, but if they need to call
 * backend functions, they go through here.
 */

export const hideMessageApi = async (
  targetType: 'room' | 'live',
  parentId: string,
  messageId: string,
  reason: string
): Promise<void> => {
  await apiFetch('/moderation/messages/hide', {
    method: 'POST',
    body: JSON.stringify({
      targetType,
      parentId,
      messageId,
      reason,
    }),
  });
};

export const closeRoomApi = async (roomId: string, reason: string): Promise<void> => {
  await apiFetch(`/moderation/rooms/${roomId}/close`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
};

export const endLiveApi = async (liveId: string, reason: string): Promise<void> => {
  await apiFetch(`/moderation/lives/${liveId}/end`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
};
