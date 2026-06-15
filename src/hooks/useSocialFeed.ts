import { useState, useEffect, useCallback } from 'react';
import socialApi from '../services/api/socialApi';
import { SocialActivity, RecommendedUser } from '../types/social';

export const useSocialFeed = () => {
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [feedActivities, recommendations] = await Promise.all([
        socialApi.getFollowingFeed(),
        socialApi.getRecommendedUsers(),
      ]);
      setActivities(feedActivities);
      setRecommendedUsers(recommendations);
    } catch (err: any) {
      console.error('Failed to load social feed:', err);
      setError('No se pudo cargar la actividad reciente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedData();
  }, [fetchFeedData]);

  return {
    activities,
    recommendedUsers,
    loading,
    refreshing,
    error,
    refresh: () => fetchFeedData(true),
  };
};
export default useSocialFeed;
