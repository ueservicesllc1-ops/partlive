import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface SocialActivityData {
  userId: string;
  type: string;
  title: string;
  description?: string;
  imageUrl?: string;
  actionType?: 'open_profile' | 'open_room' | 'open_live' | 'open_game_session' | 'open_event' | 'none';
  actionValue?: string;
  visibility: 'public' | 'followers' | 'private';
  metadata?: Record<string, any>;
}

export const followUser = async (followerId: string, followingId: string) => {
  if (followerId === followingId) {
    throw new Error('No puedes seguirte a ti mismo.');
  }

  // 1. Verify target user profile and block relationships
  const targetDoc = await db.collection('users').doc(followingId).get();
  if (!targetDoc.exists) {
    throw new Error('El usuario a seguir no existe.');
  }
  const targetData = targetDoc.data() || {};
  if (targetData.status === 'banned' || targetData.status === 'suspended') {
    throw new Error('Este usuario se encuentra suspendido o baneado.');
  }

  // Check blocks (either blockerId or blockedUserId matches)
  const blockA = await db.collection('blocks').doc(`${followerId}_${followingId}`).get();
  const blockB = await db.collection('blocks').doc(`${followingId}_${followerId}`).get();
  if (blockA.exists || blockB.exists) {
    throw new Error('No se puede realizar esta interacción debido a un bloqueo.');
  }

  const followRef = db.collection('follows').doc(`${followerId}_${followingId}`);
  const reverseFollowRef = db.collection('follows').doc(`${followingId}_${followerId}`);
  
  // Keep friend id in alphabetical order
  const friendId = [followerId, followingId].sort().join('_');
  const friendRef = db.collection('friends').doc(friendId);

  const followerRef = db.collection('users').doc(followerId);
  const followingRef = db.collection('users').doc(followingId);

  await db.runTransaction(async transaction => {
    const followSnap = await transaction.get(followRef);
    if (followSnap.exists && followSnap.data()?.status === 'active') {
      return; // Already active
    }

    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // 1. Create or set follow document
    transaction.set(followRef, {
      id: `${followerId}_${followingId}`,
      followerId,
      followingId,
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    }, { merge: true });

    // 2. Increment counters
    transaction.update(followerRef, {
      followingCount: admin.firestore.FieldValue.increment(1),
      updatedAt: timestamp,
    });
    transaction.update(followingRef, {
      followersCount: admin.firestore.FieldValue.increment(1),
      updatedAt: timestamp,
    });

    // 3. Check mutual follow
    const reverseFollowSnap = await transaction.get(reverseFollowRef);
    if (reverseFollowSnap.exists && reverseFollowSnap.data()?.status === 'active') {
      // Create mutual friendship
      transaction.set(friendRef, {
        id: friendId,
        userAId: [followerId, followingId].sort()[0],
        userBId: [followerId, followingId].sort()[1],
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp,
      }, { merge: true });

      // Increment friendsCount
      transaction.update(followerRef, {
        friendsCount: admin.firestore.FieldValue.increment(1),
      });
      transaction.update(followingRef, {
        friendsCount: admin.firestore.FieldValue.increment(1),
      });
    }
  });

  // Log social activity and trigger notifications in background
  const followerDoc = await db.collection('users').doc(followerId).get();
  const followerData = followerDoc.data() || {};

  await createSocialActivity({
    userId: followerId,
    type: 'follow',
    title: 'Nuevo Seguidor',
    description: `${followerData.displayName || followerData.username} comenzó a seguir a ${targetData.displayName || targetData.username}`,
    actionType: 'open_profile',
    actionValue: followingId,
    visibility: 'public',
  });

  // Create notifications doc in target user notifications subcollection
  await db.collection('users').doc(followingId).collection('notifications').add({
    title: 'Nuevo Seguidor 👤',
    body: `${followerData.displayName || followerData.username || 'Un usuario'} comenzó a seguirte.`,
    type: 'follow',
    senderId: followerId,
    senderName: followerData.displayName || followerData.username || '',
    senderPhotoURL: followerData.photoURL || '',
    actionType: 'open_profile',
    actionValue: followerId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    read: false,
  });
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const followRef = db.collection('follows').doc(`${followerId}_${followingId}`);
  
  // Keep friend id in alphabetical order
  const friendId = [followerId, followingId].sort().join('_');
  const friendRef = db.collection('friends').doc(friendId);

  const followerRef = db.collection('users').doc(followerId);
  const followingRef = db.collection('users').doc(followingId);

  await db.runTransaction(async transaction => {
    const followSnap = await transaction.get(followRef);
    if (!followSnap.exists || followSnap.data()?.status === 'removed') {
      return; // Already removed
    }

    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // 1. Mark follow removed
    transaction.update(followRef, {
      status: 'removed',
      updatedAt: timestamp,
    });

    // 2. Decrement counters
    const followerSnap = await transaction.get(followerRef);
    const followingSnap = await transaction.get(followingRef);

    const followerData = followerSnap.data() || {};
    const followingData = followingSnap.data() || {};

    const currentFollowing = Math.max(0, (followerData.followingCount || 0) - 1);
    const currentFollowers = Math.max(0, (followingData.followersCount || 0) - 1);

    transaction.update(followerRef, {
      followingCount: currentFollowing,
      updatedAt: timestamp,
    });
    transaction.update(followingRef, {
      followersCount: currentFollowers,
      updatedAt: timestamp,
    });

    // 3. Mark friend removed if it exists and decrement friend count
    const friendSnap = await transaction.get(friendRef);
    if (friendSnap.exists && friendSnap.data()?.status === 'active') {
      transaction.update(friendRef, {
        status: 'removed',
        updatedAt: timestamp,
      });

      const currentFriendsFollower = Math.max(0, (followerData.friendsCount || 0) - 1);
      const currentFriendsFollowing = Math.max(0, (followingData.friendsCount || 0) - 1);

      transaction.update(followerRef, {
        friendsCount: currentFriendsFollower,
      });
      transaction.update(followingRef, {
        friendsCount: currentFriendsFollowing,
      });
    }
  });
};

export const createSocialActivity = async (data: SocialActivityData) => {
  const userDoc = await db.collection('users').doc(data.userId).get();
  const userData = userDoc.data() || {};

  const activityDoc = {
    ...data,
    username: userData.username || '',
    userPhotoURL: userData.photoURL || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection('socialActivities').add(activityDoc);
  
  // Update last social activity timestamp
  await db.collection('users').doc(data.userId).update({
    lastSocialActivityAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

export const getUserActivities = async (userId: string, viewerId: string, limitCount = 20) => {
  let query = db.collection('socialActivities')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc');

  // Check if they are friends or follower
  let relationship = 'public';
  if (viewerId === userId) {
    relationship = 'owner';
  } else {
    const followSnap = await db.collection('follows').doc(`${viewerId}_${userId}`).get();
    if (followSnap.exists && followSnap.data()?.status === 'active') {
      relationship = 'followers';
    }
  }

  const snapshot = await query.limit(limitCount).get();
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Apply privacy filters
  return docs.filter((doc: any) => {
    if (relationship === 'owner') return true;
    if (doc.visibility === 'public') return true;
    if (doc.visibility === 'followers' && relationship === 'followers') return true;
    return false;
  });
};

export const getFollowingActivities = async (userId: string, limitCount = 20) => {
  // 1. Get user following list
  const followingSnap = await db.collection('follows')
    .where('followerId', '==', userId)
    .where('status', '==', 'active')
    .get();

  const followingIds = followingSnap.docs.map(doc => doc.data().followingId);
  if (followingIds.length === 0) return [];

  // Firestore in queries are limited to 10 elements. Chunking or getting all public activities
  // For MVP, we can retrieve last 50 activities and filter them in memory
  const snapshot = await db.collection('socialActivities')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return docs.filter((doc: any) => followingIds.includes(doc.userId) && doc.visibility !== 'private').slice(0, limitCount);
};

export const getRecommendedUsers = async (userId: string) => {
  // 1. Find blocked users to exclude
  const blocksSnapA = await db.collection('blocks').where('blockerId', '==', userId).get();
  const blocksSnapB = await db.collection('blocks').where('blockedUserId', '==', userId).get();
  const blockedIds = new Set<string>();
  blocksSnapA.docs.forEach(doc => blockedIds.add(doc.data().blockedUserId));
  blocksSnapB.docs.forEach(doc => blockedIds.add(doc.data().blockerId));

  // 2. Find already followed users
  const followsSnap = await db.collection('follows')
    .where('followerId', '==', userId)
    .where('status', '==', 'active')
    .get();
  const followedIds = new Set<string>(followsSnap.docs.map(doc => doc.data().followingId));

  // 3. Query lives to recommend active hosts
  const livesSnap = await db.collection('lives').where('status', '==', 'live').limit(5).get();
  const activeHostIds = livesSnap.docs.map(doc => doc.data().hostId);

  // 4. Query users (excluding self, blocked, followed)
  const usersSnap = await db.collection('users')
    .where('status', '==', 'active')
    .limit(30)
    .get();

  const currentUserDoc = await db.collection('users').doc(userId).get();
  const currentUserData = currentUserDoc.data() || {};

  const recommendations: any[] = [];

  usersSnap.docs.forEach(doc => {
    const id = doc.id;
    if (id === userId) return;
    if (blockedIds.has(id)) return;
    if (followedIds.has(id)) return;

    const data = doc.data();
    let score = 0;
    let reason: any = 'popular_host';

    if (activeHostIds.includes(id)) {
      score += 100;
      reason = 'active_now';
    } else if (data.country === currentUserData.country) {
      score += 50;
      reason = 'same_country';
    } else if (data.language === currentUserData.language) {
      score += 30;
      reason = 'same_language';
    } else if (data.isVip) {
      score += 20;
      reason = 'vip';
    } else {
      score += data.followersCount || 0;
      reason = data.isHost ? 'popular_host' : 'trending';
    }

    recommendations.push({
      id,
      userId: id,
      displayName: data.displayName || data.username || 'Usuario',
      username: data.username || '',
      photoURL: data.photoURL || undefined,
      reason,
      score,
    });
  });

  return recommendations.sort((a, b) => b.score - a.score).slice(0, 10);
};

export const updateSocialCounters = async (userId: string) => {
  const followersSnap = await db.collection('follows')
    .where('followingId', '==', userId)
    .where('status', '==', 'active')
    .get();

  const followingSnap = await db.collection('follows')
    .where('followerId', '==', userId)
    .where('status', '==', 'active')
    .get();

  const friendsSnap = await db.collection('friends')
    .where('status', '==', 'active')
    .get();
  
  const friendsCount = friendsSnap.docs.filter(doc => {
    const data = doc.data();
    return data.userAId === userId || data.userBId === userId;
  }).length;

  await db.collection('users').doc(userId).update({
    followersCount: followersSnap.size,
    followingCount: followingSnap.size,
    friendsCount,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};
