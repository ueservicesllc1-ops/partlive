import { useState, useEffect, useCallback } from 'react';
import socialApi from '../services/api/socialApi';
import { UserProfile } from '../types/user';

export type SocialListType = 'followers' | 'following' | 'friends';

export const useSocialLists = (userId: string, listType: SocialListType) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      let data: UserProfile[] = [];
      if (listType === 'followers') {
        data = await socialApi.getFollowers(userId);
      } else if (listType === 'following') {
        data = await socialApi.getFollowing(userId);
      } else if (listType === 'friends') {
        data = await socialApi.getFriends();
      }
      setUsers(data);
    } catch (err: any) {
      console.error(`Failed to fetch social list (${listType}):`, err);
      setError('Error al cargar la lista social.');
    } finally {
      setLoading(false);
    }
  }, [userId, listType]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return {
    users,
    loading,
    error,
    refresh: fetchList,
  };
};
export default useSocialLists;
