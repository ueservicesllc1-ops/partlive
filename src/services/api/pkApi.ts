import { apiFetch } from './apiClient';
import { PkBattle, PkInvite } from '../../types/pk';

export const inviteHostToPk = async (
  toHostId: string,
  fromLiveId: string,
  message?: string
): Promise<PkInvite> => {
  const data = await apiFetch('/pk/invite', {
    method: 'POST',
    body: JSON.stringify({ toHostId, fromLiveId, message }),
  });
  return data.invite;
};

export const acceptPkInvite = async (
  inviteId: string,
  toLiveId: string
): Promise<PkBattle> => {
  const data = await apiFetch('/pk/accept', {
    method: 'POST',
    body: JSON.stringify({ inviteId, toLiveId }),
  });
  return data.battle;
};

export const rejectPkInvite = async (
  inviteId: string,
  reason?: string
): Promise<void> => {
  await apiFetch('/pk/reject', {
    method: 'POST',
    body: JSON.stringify({ inviteId, reason }),
  });
};

export const cancelPkInvite = async (inviteId: string): Promise<void> => {
  await apiFetch('/pk/cancel', {
    method: 'POST',
    body: JSON.stringify({ inviteId }),
  });
};

export const finishPkBattle = async (
  pkBattleId: string,
  reason?: string
): Promise<PkBattle> => {
  const data = await apiFetch('/pk/finish', {
    method: 'POST',
    body: JSON.stringify({ pkBattleId, reason }),
  });
  return data.battle;
};

export const cancelPkBattle = async (
  pkBattleId: string,
  reason?: string
): Promise<void> => {
  await apiFetch('/pk/cancel-battle', {
    method: 'POST',
    body: JSON.stringify({ pkBattleId, reason }),
  });
};

export const getActivePkBattleByLive = async (
  liveId: string
): Promise<PkBattle | null> => {
  const data = await apiFetch(`/pk/active/${liveId}`);
  return data.battle;
};

export const getHostPkHistory = async (
  hostId: string,
  limit = 20
): Promise<PkBattle[]> => {
  const data = await apiFetch(`/pk/history/${hostId}?limit=${limit}`);
  return data.history;
};
