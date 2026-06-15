import { apiFetch } from './apiClient';
import {
  KaraokeSong,
  KaraokeQueueItem,
  KaraokeSession,
  KaraokePerformance,
  KaraokeBattle,
} from '../../types/karaoke';

export async function getSongs(filters?: { genre?: string; language?: string; query?: string }): Promise<KaraokeSong[]> {
  const params = new URLSearchParams();
  if (filters?.genre) params.append('genre', filters.genre);
  if (filters?.language) params.append('language', filters.language);
  if (filters?.query) params.append('query', filters.query);
  const queryStr = params.toString();
  return apiFetch(`/karaoke/songs${queryStr ? `?${queryStr}` : ''}`);
}

export async function getSongById(songId: string): Promise<KaraokeSong> {
  return apiFetch(`/karaoke/songs/${songId}`);
}

export async function getFavorites(): Promise<KaraokeSong[]> {
  return apiFetch('/karaoke/favorites');
}

export async function addFavorite(songId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/favorites/${songId}`, {
    method: 'POST',
  });
}

export async function removeFavorite(songId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/favorites/${songId}`, {
    method: 'DELETE',
  });
}

export async function startSession(targetType: 'room' | 'live', targetId: string): Promise<KaraokeSession> {
  return apiFetch('/karaoke/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ targetType, targetId }),
  });
}

export async function endSession(sessionId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/sessions/${sessionId}/end`, {
    method: 'POST',
  });
}

export async function getActiveSession(targetType: 'room' | 'live', targetId: string): Promise<KaraokeSession | null> {
  return apiFetch(`/karaoke/sessions/active?targetType=${targetType}&targetId=${targetId}`);
}

export async function requestSong(targetType: 'room' | 'live', targetId: string, songId: string): Promise<KaraokeQueueItem> {
  return apiFetch('/karaoke/queue/request', {
    method: 'POST',
    body: JSON.stringify({ targetType, targetId, songId }),
  });
}

export async function getQueue(sessionId: string): Promise<KaraokeQueueItem[]> {
  return apiFetch(`/karaoke/queue/${sessionId}`);
}

export async function approveQueueItem(queueItemId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/queue/${queueItemId}/approve`, {
    method: 'POST',
  });
}

export async function rejectQueueItem(queueItemId: string, reason?: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/queue/${queueItemId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function startQueueItem(queueItemId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/queue/${queueItemId}/start`, {
    method: 'POST',
  });
}

export async function completeQueueItem(queueItemId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/queue/${queueItemId}/complete`, {
    method: 'POST',
  });
}

export async function skipQueueItem(queueItemId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/queue/${queueItemId}/skip`, {
    method: 'POST',
  });
}

export async function getSingerPerformances(userId: string): Promise<KaraokePerformance[]> {
  return apiFetch(`/karaoke/performances/user/${userId}`);
}

export async function createBattle(battleData: Partial<KaraokeBattle>): Promise<KaraokeBattle> {
  return apiFetch('/karaoke/battles', {
    method: 'POST',
    body: JSON.stringify(battleData),
  });
}

export async function joinBattle(battleId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/battles/${battleId}/join`, {
    method: 'POST',
  });
}

export async function voteBattle(battleId: string, participantId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/battles/${battleId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ participantId }),
  });
}

export async function endBattle(battleId: string): Promise<{ winnerId: string | null }> {
  return apiFetch(`/karaoke/battles/${battleId}/end`, {
    method: 'POST',
  });
}

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

export async function adminCreateSong(songData: Partial<KaraokeSong>): Promise<KaraokeSong> {
  return apiFetch('/karaoke/admin/songs', {
    method: 'POST',
    body: JSON.stringify(songData),
  });
}

export async function adminUpdateSong(songId: string, songData: Partial<KaraokeSong>): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/admin/songs/${songId}`, {
    method: 'PATCH',
    body: JSON.stringify(songData),
  });
}

export async function adminApproveSong(songId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/admin/songs/${songId}/approve`, {
    method: 'POST',
  });
}

export async function adminRejectSong(songId: string, reason: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/admin/songs/${songId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function adminDeactivateSong(songId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/karaoke/admin/songs/${songId}/deactivate`, {
    method: 'POST',
  });
}
