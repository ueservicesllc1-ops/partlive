import firestore from '@react-native-firebase/firestore';
import { UserProfile } from '../../../types/user';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

import { updateUsername } from './usernameService';

export const createUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const timestamp = firestore.FieldValue.serverTimestamp();
  await firestore().collection(FirestoreCollections.USERS).doc(uid).set({
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastActiveAt: timestamp,
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const doc = await firestore().collection(FirestoreCollections.USERS).doc(uid).get();
  if (doc.exists()) {
    return { uid: doc.id, ...doc.data() } as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const updates: any = {
    ...data,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  
  if (data.username !== undefined) {
    updates.usernameLowercase = data.username.trim().toLowerCase();
  }
  
  await firestore().collection(FirestoreCollections.USERS).doc(uid).update(updates);
};

export const getPublicUserProfile = async (uid: string): Promise<Partial<UserProfile> | null> => {
  const profile = await getUserProfile(uid);
  if (!profile) return null;
  
  // Return only safe public fields
  return {
    uid: profile.uid,
    displayName: profile.displayName,
    username: profile.username,
    photoURL: profile.photoURL,
    bio: profile.bio,
    country: profile.country,
    language: profile.language,
    level: profile.level,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    totalGiftsReceived: profile.totalGiftsReceived,
    roomsJoinedCount: profile.roomsJoinedCount,
    gamesPlayedCount: profile.gamesPlayedCount,
    isHost: profile.isHost,
    isVerified: profile.isVerified,
    role: profile.role,
    badges: profile.badges,
    interests: profile.interests,
  };
};

export const updateEditableProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const allowedFields = ['displayName', 'bio', 'country', 'language', 'interests', 'photoURL'];
  const updates: any = { updatedAt: firestore.FieldValue.serverTimestamp() };

  // Filter only allowed fields
  for (const field of allowedFields) {
    if ((data as any)[field] !== undefined) {
      updates[field] = (data as any)[field];
    }
  }

  // Handle username separately due to transaction requirement
  if (data.username) {
    const currentProfile = await getUserProfile(uid);
    if (currentProfile?.username !== data.username) {
      await updateUsername(uid, currentProfile?.username || '', data.username);
      updates.username = data.username;
      updates.usernameLowercase = data.username.trim().toLowerCase();
    }
  }

  if (Object.keys(updates).length > 1) { // more than just updatedAt
    await firestore().collection(FirestoreCollections.USERS).doc(uid).update(updates);
  }
};

export const updateProfilePhoto = async (uid: string, photoURL: string): Promise<void> => {
  await firestore().collection(FirestoreCollections.USERS).doc(uid).update({
    photoURL,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const incrementUserStat = async (uid: string, field: string, amount: number = 1): Promise<void> => {
  await firestore().collection(FirestoreCollections.USERS).doc(uid).update({
    [field]: firestore.FieldValue.increment(amount),
  });
};

export const completeUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  if (data.username) {
    // We pass empty string for oldUsername since they didn't have one officially set up
    await updateUsername(uid, '', data.username);
  }
  
  await updateUserProfile(uid, {
    ...data,
    profileCompleted: true,
  });
};

export const checkProfileCompleted = async (uid: string): Promise<boolean> => {
  const profile = await getUserProfile(uid);
  return !!profile?.profileCompleted;
};

export const ensureUserProfile = async (firebaseUser: FirebaseAuthTypes.User): Promise<UserProfile> => {
  const { uid, email, displayName, photoURL } = firebaseUser;
  let userProfile = await getUserProfile(uid);

  if (!userProfile) {
    const newProfile: Partial<UserProfile> = {
      displayName: displayName || email?.split('@')[0] || 'Nuevo Usuario',
      username: '', // Enforce profile setup for username
      email: email || undefined,
      photoURL: photoURL || undefined,
      level: 1,
      xp: 0,
      coins: 0,
      diamonds: 0,
      followersCount: 0,
      followingCount: 0,
      friendsCount: 0,
      totalGiftsSent: 0,
      totalGiftsReceived: 0,
      roomsJoinedCount: 0,
      livesWatchedCount: 0,
      gamesPlayedCount: 0,
      isHost: false,
      isVerified: false,
      role: 'user',
      profileCompleted: false, // Forces setup
      authProvider: firebaseUser.providerData.some(p => p.providerId === 'google.com') ? 'google' : 'email',
      status: 'active',
      badges: [],
      interests: [],
    };

    await createUserProfile(uid, newProfile);
    userProfile = await getUserProfile(uid);
  }

  return userProfile as UserProfile;
};

export const updateLastActive = async (uid: string): Promise<void> => {
  await firestore().collection(FirestoreCollections.USERS).doc(uid).update({
    lastActiveAt: firestore.FieldValue.serverTimestamp(),
  });
};
