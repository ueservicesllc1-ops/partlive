import { useState, useEffect, useCallback } from 'react';
import { listenIsFollowing } from '../services/firebase/firestore/followsService';
import socialApi from '../services/api/socialApi';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../constants/firestoreCollections';

export const useFollow = (targetUserId: string) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = auth().currentUser;
  const currentUserId = currentUser?.uid || '';

  // Listen to following state
  useEffect(() => {
    if (!currentUserId || !targetUserId) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenIsFollowing(currentUserId, targetUserId, hasFollow => {
      setIsFollowing(hasFollow);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId, targetUserId]);

  // Listen to profile stats
  useEffect(() => {
    if (!targetUserId) return;

    const unsubscribe = firestore()
      .collection(FirestoreCollections.USERS)
      .doc(targetUserId)
      .onSnapshot(doc => {
        if (doc.exists()) {
          const data = doc.data() || {};
          setFollowersCount(data.followersCount || 0);
          setFollowingCount(data.followingCount || 0);
        }
      });

    return () => unsubscribe();
  }, [targetUserId]);

  const follow = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    setActionLoading(true);
    setError(null);
    
    // Optimistic UI Update
    setIsFollowing(true);
    setFollowersCount(prev => prev + 1);

    try {
      await socialApi.followUser(targetUserId);
    } catch (err: any) {
      console.error('Failed to follow user:', err);
      setError('No se pudo seguir al usuario.');
      // Rollback
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } finally {
      setActionLoading(false);
    }
  }, [currentUserId, targetUserId]);

  const unfollow = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    setActionLoading(true);
    setError(null);

    // Optimistic UI Update
    setIsFollowing(false);
    setFollowersCount(prev => Math.max(0, prev - 1));

    try {
      await socialApi.unfollowUser(targetUserId);
    } catch (err: any) {
      console.error('Failed to unfollow user:', err);
      setError('No se pudo dejar de seguir al usuario.');
      // Rollback
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    } finally {
      setActionLoading(false);
    }
  }, [currentUserId, targetUserId]);

  const toggleFollow = useCallback(async () => {
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  }, [isFollowing, follow, unfollow]);

  return {
    isFollowing,
    followersCount,
    followingCount,
    loading,
    actionLoading,
    error,
    follow,
    unfollow,
    toggleFollow,
  };
};
export default useFollow;
