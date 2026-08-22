import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface HostApplication {
  id: string;
  userId: string;
  displayName: string;
  category: string;
  bio: string;
  country: string;
  status: 'APPLIED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  createdAt: any;
  updatedAt: any;
}

export interface CreatorProfile {
  userId: string;
  isHost: boolean;
  creatorLevel: string;
  creatorXp: number;
  agencyId?: string;
  category: string;
  liveHoursCount: number;
  updatedAt: any;
}

export const submitHostApplication = async (
  userId: string,
  data: { displayName: string; category: string; bio: string; country: string }
): Promise<HostApplication> => {
  const appRef = db.collection('hostApplications').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const application: HostApplication = {
    id: appRef.id,
    userId,
    displayName: data.displayName,
    category: data.category,
    bio: data.bio,
    country: data.country || 'US',
    status: 'PENDING_REVIEW',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await appRef.set(application);
  return application;
};

export const reviewHostApplication = async (
  applicationId: string,
  approve: boolean,
  adminId: string
): Promise<HostApplication> => {
  const appRef = db.collection('hostApplications').doc(applicationId);
  const snap = await appRef.get();
  if (!snap.exists) throw new Error(`APPLICATION_NOT_FOUND: ${applicationId}`);

  const application = snap.data() as HostApplication;
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const newStatus = approve ? 'APPROVED' : 'REJECTED';

  await db.runTransaction(async (transaction) => {
    transaction.update(appRef, {
      status: newStatus,
      reviewedBy: adminId,
      updatedAt: timestamp,
    });

    if (approve) {
      const userRef = db.collection('users').doc(application.userId);
      transaction.update(userRef, {
        isHost: true,
        role: 'host',
        hostCategory: application.category,
        creatorLevel: 'Rookie',
        creatorXp: 0,
        updatedAt: timestamp,
      });
    }

    // Audit log
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      id: auditRef.id,
      actor: adminId,
      action: approve ? 'HOST_APPLICATION_APPROVED' : 'HOST_APPLICATION_REJECTED',
      applicationId,
      userId: application.userId,
      timestamp,
    });
  });

  const updatedSnap = await appRef.get();
  return updatedSnap.data() as HostApplication;
};

export const awardCreatorXP = async (userId: string, xpAmount: number): Promise<CreatorProfile> => {
  const userRef = db.collection('users').doc(userId);
  const snap = await userRef.get();
  if (!snap.exists) throw new Error(`USER_NOT_FOUND: ${userId}`);

  const currentXp = (snap.data()?.creatorXp || 0) + xpAmount;

  // Level thresholds
  let level = 'Rookie';
  if (currentXp >= 10000) level = 'Star';
  else if (currentXp >= 2000) level = 'Elite';
  else if (currentXp >= 500) level = 'Pro';
  else if (currentXp >= 100) level = 'Rising';

  await userRef.update({
    creatorXp: currentXp,
    creatorLevel: level,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const updated = await userRef.get();
  const data = updated.data()!;

  return {
    userId,
    isHost: data.isHost || false,
    creatorLevel: data.creatorLevel || 'Rookie',
    creatorXp: data.creatorXp || 0,
    agencyId: data.agencyId || '',
    category: data.hostCategory || 'General',
    liveHoursCount: data.liveHoursCount || 0,
    updatedAt: data.updatedAt,
  };
};

export const getCreatorProfile = async (userId: string): Promise<CreatorProfile> => {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) throw new Error(`USER_NOT_FOUND: ${userId}`);

  const data = snap.data()!;
  return {
    userId,
    isHost: data.isHost || false,
    creatorLevel: data.creatorLevel || 'Rookie',
    creatorXp: data.creatorXp || 0,
    agencyId: data.agencyId || '',
    category: data.hostCategory || 'General',
    liveHoursCount: data.liveHoursCount || 0,
    updatedAt: data.updatedAt,
  };
};
