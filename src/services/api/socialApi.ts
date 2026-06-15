import { apiFetch } from './apiClient';
import { UserProfile } from '../../types/user';
import { SocialActivity, RecommendedUser } from '../../types/social';

export const followUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  return apiFetch(`/social/follow/${userId}`, { method: 'POST' });
};

export const unfollowUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
  return apiFetch(`/social/unfollow/${userId}`, { method: 'POST' });
};

export const isFollowing = async (userId: string): Promise<{ isFollowing: boolean }> => {
  return apiFetch(`/social/is-following/${userId}`, { method: 'GET' });
};

export const getFollowers = async (userId: string): Promise<UserProfile[]> => {
  return apiFetch(`/social/${userId}/followers`, { method: 'GET' });
};

export const getFollowing = async (userId: string): Promise<UserProfile[]> => {
  return apiFetch(`/social/${userId}/following`, { method: 'GET' });
};

export const getFriends = async (): Promise<UserProfile[]> => {
  return apiFetch('/social/friends', { method: 'GET' });
};

export const getUserActivities = async (userId: string): Promise<SocialActivity[]> => {
  return apiFetch(`/social/${userId}/activities`, { method: 'GET' });
};

export const getFollowingFeed = async (): Promise<SocialActivity[]> => {
  return apiFetch('/social/feed/following', { method: 'GET' });
};

export const getRecommendedUsers = async (): Promise<RecommendedUser[]> => {
  return apiFetch('/social/recommended', { method: 'GET' });
};
export default {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowers,
  getFollowing,
  getFriends,
  getUserActivities,
  getFollowingFeed,
  getRecommendedUsers,
};
