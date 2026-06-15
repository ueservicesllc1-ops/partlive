import { apiFetch } from './apiClient';
import { Mission, UserMissionProgress, MissionReward } from '../../types/mission';

export async function getActiveMissions(): Promise<Mission[]> {
  return apiFetch('/missions/active');
}

export async function getMyMissionProgress(): Promise<UserMissionProgress[]> {
  return apiFetch('/missions/my-progress');
}

export async function claimMissionReward(progressId: string): Promise<{ success: boolean; reward: MissionReward }> {
  return apiFetch(`/missions/${progressId}/claim`, {
    method: 'POST',
  });
}

export async function devTrackMission(actionType: string, amount: number = 1, metadata?: any): Promise<{ success: boolean; message: string }> {
  return apiFetch('/missions/track', {
    method: 'POST',
    body: JSON.stringify({ actionType, amount, metadata }),
  });
}
