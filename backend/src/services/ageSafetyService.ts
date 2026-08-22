import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface UserAgeProfile {
  userId: string;
  ageStatus: 'UNKNOWN' | 'AGE_DECLARED' | 'VERIFIED' | 'RESTRICTED' | 'ADULT';
  dateOfBirth?: string;
  calculatedAge?: number;
  contentAgeRating: 'GENERAL' | 'MATURE' | 'RESTRICTED';
  updatedAt: any;
}

export const declareUserAge = async (
  userId: string,
  dateOfBirth: string
): Promise<UserAgeProfile> => {
  const dobDate = new Date(dateOfBirth);
  if (isNaN(dobDate.getTime())) throw new Error('INVALID_DATE: Date of birth format must be YYYY-MM-DD');

  const today = new Date();
  let calculatedAge = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
    calculatedAge--;
  }

  if (calculatedAge < 13) {
    throw new Error('UNDERAGE_BLOCKED: PartyLive minimum age requirement is 13 years old.');
  }

  const ageStatus: UserAgeProfile['ageStatus'] = calculatedAge < 18 ? 'RESTRICTED' : 'ADULT';
  const contentAgeRating: UserAgeProfile['contentAgeRating'] = calculatedAge < 18 ? 'GENERAL' : 'MATURE';

  const ref = db.collection('userAgeProfile').doc(userId);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const profile: UserAgeProfile = {
    userId,
    ageStatus,
    dateOfBirth,
    calculatedAge,
    contentAgeRating,
    updatedAt: timestamp,
  };

  await ref.set(profile);

  // Sync basic age status to user cache
  await db.collection('users').doc(userId).update({
    ageStatus,
    isMinor: calculatedAge < 18,
    updatedAt: timestamp,
  });

  return profile;
};

export const canUserAccessAgeRestrictedContent = async (
  userId: string,
  requiredRating: 'GENERAL' | 'MATURE' | 'RESTRICTED'
): Promise<boolean> => {
  if (requiredRating === 'GENERAL') return true;

  const snap = await db.collection('userAgeProfile').doc(userId).get();
  if (!snap.exists) return false;

  const profile = snap.data() as UserAgeProfile;
  if (profile.ageStatus === 'RESTRICTED') {
    return false;
  }

  return profile.ageStatus === 'ADULT' || profile.ageStatus === 'VERIFIED';
};
