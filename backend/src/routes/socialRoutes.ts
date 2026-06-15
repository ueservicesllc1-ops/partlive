import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { db } from '../config/firebase';
import {
  followUser,
  unfollowUser,
  getRecommendedUsers,
  getFollowingActivities,
  getUserActivities,
} from '../services/socialService';

export const socialRoutes = Router();

// Follow a user
socialRoutes.post('/follow/:userId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.user?.uid;
    const followingId = req.params.userId as string;

    if (!followerId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await followUser(followerId, followingId);
    res.json({ success: true, message: 'Usuario seguido exitosamente.' });
  } catch (error: any) {
    console.error('Error in POST /api/social/follow:', error);
    res.status(400).json({ error: error.message || 'Error al seguir al usuario.' });
  }
});

// Unfollow a user
socialRoutes.post('/unfollow/:userId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.user?.uid;
    const followingId = req.params.userId as string;

    if (!followerId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await unfollowUser(followerId, followingId);
    res.json({ success: true, message: 'Has dejado de seguir al usuario.' });
  } catch (error: any) {
    console.error('Error in POST /api/social/unfollow:', error);
    res.status(400).json({ error: error.message || 'Error al dejar de seguir al usuario.' });
  }
});

// Check if following target user
socialRoutes.get('/is-following/:userId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const followerId = req.user?.uid;
    const followingId = req.params.userId;

    if (!followerId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const doc = await db.collection('follows').doc(`${followerId}_${followingId}`).get();
    const isFollowing = doc.exists && doc.data()?.status === 'active';
    res.json({ isFollowing });
  } catch (error) {
    console.error('Error in GET /api/social/is-following:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch followers list
socialRoutes.get('/:userId/followers', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const snap = await db.collection('follows')
      .where('followingId', '==', userId)
      .where('status', '==', 'active')
      .get();

    const followerIds = snap.docs.map(doc => doc.data().followerId);
    if (followerIds.length === 0) {
      res.json([]);
      return;
    }

    // Load user profiles
    const usersSnap = await db.collection('users').where('status', '==', 'active').get();
    const profiles = usersSnap.docs
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter((profile: any) => followerIds.includes(profile.uid));

    res.json(profiles);
  } catch (error) {
    console.error('Error in GET /api/social/followers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch following list
socialRoutes.get('/:userId/following', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const snap = await db.collection('follows')
      .where('followerId', '==', userId)
      .where('status', '==', 'active')
      .get();

    const followingIds = snap.docs.map(doc => doc.data().followingId);
    if (followingIds.length === 0) {
      res.json([]);
      return;
    }

    // Load user profiles
    const usersSnap = await db.collection('users').where('status', '==', 'active').get();
    const profiles = usersSnap.docs
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter((profile: any) => followingIds.includes(profile.uid));

    res.json(profiles);
  } catch (error) {
    console.error('Error in GET /api/social/following:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch friends list (mutual follows)
socialRoutes.get('/friends', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const snap = await db.collection('friends')
      .where('status', '==', 'active')
      .get();

    const friendIds = snap.docs
      .map(doc => {
        const data = doc.data();
        return data.userAId === userId ? data.userBId : data.userBId === userId ? data.userAId : null;
      })
      .filter(id => id !== null);

    if (friendIds.length === 0) {
      res.json([]);
      return;
    }

    // Load profiles
    const usersSnap = await db.collection('users').where('status', '==', 'active').get();
    const profiles = usersSnap.docs
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter((profile: any) => friendIds.includes(profile.uid));

    res.json(profiles);
  } catch (error) {
    console.error('Error in GET /api/social/friends:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch target user public activities
socialRoutes.get('/:userId/activities', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const viewerId = req.user?.uid || '';
    const activities = await getUserActivities(userId, viewerId);
    res.json(activities);
  } catch (error) {
    console.error('Error in GET /api/social/activities:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch following feed
socialRoutes.get('/feed/following', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const activities = await getFollowingActivities(userId);
    res.json(activities);
  } catch (error) {
    console.error('Error in GET /api/social/feed/following:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get recommended users
socialRoutes.get('/recommended', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const recommendations = await getRecommendedUsers(userId);
    res.json(recommendations);
  } catch (error) {
    console.error('Error in GET /api/social/recommended:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default socialRoutes;
