import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

const AGENCIES = 'agencies';
const AGENCY_HOSTS = 'agencyHosts';
const AGENCY_COMMISSIONS = 'agencyCommissions';
const USERS = 'users';

export const applyForAgency = async (
  ownerId: string,
  name: string,
  country: string,
  email: string,
  phone?: string
): Promise<string> => {
  const agencyRef = db.collection(AGENCIES).doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await agencyRef.set({
    id: agencyRef.id,
    ownerId,
    name,
    country,
    contactEmail: email,
    contactPhone: phone || null,
    status: 'pending',
    commissionPercent: 10, // Default 10% agency cut from platform share
    totalHosts: 0,
    totalBeansGenerated: 0,
    totalCommissionBeans: 0,
    createdAt: now,
    updatedAt: now,
  });

  return agencyRef.id;
};

export const approveAgency = async (agencyId: string, commissionPercent?: number): Promise<void> => {
  const agencyRef = db.collection(AGENCIES).doc(agencyId);
  const agencySnap = await agencyRef.get();
  if (!agencySnap.exists) throw new Error('Agency not found');
  const agency = agencySnap.data()!;

  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    transaction.update(agencyRef, {
      status: 'approved',
      commissionPercent: commissionPercent !== undefined ? commissionPercent : 10,
      updatedAt: now,
    });

    transaction.update(db.collection(USERS).doc(agency.ownerId), {
      role: 'agency',
      updatedAt: now,
    });
  });
};

export const rejectAgency = async (agencyId: string): Promise<void> => {
  await db.collection(AGENCIES).doc(agencyId).update({
    status: 'rejected',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

export const addHostToAgency = async (agencyId: string, hostId: string): Promise<void> => {
  const agencyHostRef = db.collection(AGENCY_HOSTS).doc(`${agencyId}_${hostId}`);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    const agencySnap = await transaction.get(db.collection(AGENCIES).doc(agencyId));
    if (!agencySnap.exists) throw new Error('Agency not found');
    if (agencySnap.data()!.status !== 'approved') throw new Error('Agency is not active');

    const hostUserSnap = await transaction.get(db.collection(USERS).doc(hostId));
    if (!hostUserSnap.exists) throw new Error('Host user not found');
    if (hostUserSnap.data()!.role !== 'host') throw new Error('User is not a host');

    transaction.set(agencyHostRef, {
      id: `${agencyId}_${hostId}`,
      agencyId,
      hostId,
      status: 'active',
      joinedAt: now,
    });

    transaction.update(db.collection(AGENCIES).doc(agencyId), {
      totalHosts: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });

    // Update host user profile with agencyId so analytics can track commissions correctly
    transaction.update(db.collection(USERS).doc(hostId), {
      agencyId,
      updatedAt: now,
    });
  });
};

export const removeHostFromAgency = async (agencyId: string, hostId: string): Promise<void> => {
  const agencyHostRef = db.collection(AGENCY_HOSTS).doc(`${agencyId}_${hostId}`);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    const linkSnap = await transaction.get(agencyHostRef);
    if (!linkSnap.exists || linkSnap.data()!.status !== 'active') {
      throw new Error('Host is not actively in this agency');
    }

    transaction.update(agencyHostRef, {
      status: 'removed',
      removedAt: now,
    });

    transaction.update(db.collection(AGENCIES).doc(agencyId), {
      totalHosts: admin.firestore.FieldValue.increment(-1),
      updatedAt: now,
    });

    // Clear agencyId from host user profile
    transaction.update(db.collection(USERS).doc(hostId), {
      agencyId: admin.firestore.FieldValue.delete(),
      updatedAt: now,
    });
  });
};

/**
 * Calculates and registers commission for the agency when a host receives a gift.
 * Commision is paid from platform share to avoid double charging the host.
 */
export const calculateAgencyCommission = async (
  hostId: string,
  giftEventId: string,
  beansGenerated: number
): Promise<number> => {
  // Find if host has an active agency
  const linksSnap = await db.collection(AGENCY_HOSTS)
    .where('hostId', '==', hostId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (linksSnap.empty) return 0;
  const link = linksSnap.docs[0].data();
  const agencyId = link.agencyId;

  const agencySnap = await db.collection(AGENCIES).doc(agencyId).get();
  if (!agencySnap.exists || agencySnap.data()!.status !== 'approved') return 0;
  const agency = agencySnap.data()!;

  const commissionPercent = agency.commissionPercent || 10;
  const commissionBeans = Math.floor(beansGenerated * (commissionPercent / 100));

  if (commissionBeans <= 0) return 0;

  const now = admin.firestore.FieldValue.serverTimestamp();
  const commissionRef = db.collection(AGENCY_COMMISSIONS).doc();

  await db.runTransaction(async (transaction) => {
    transaction.set(commissionRef, {
      id: commissionRef.id,
      agencyId,
      hostId,
      giftEventId,
      beansGenerated,
      commissionBeans,
      status: 'pending',
      createdAt: now,
    });

    transaction.update(db.collection(AGENCIES).doc(agencyId), {
      totalBeansGenerated: admin.firestore.FieldValue.increment(beansGenerated),
      totalCommissionBeans: admin.firestore.FieldValue.increment(commissionBeans),
      updatedAt: now,
    });

    // We credit the agency owner wallet
    transaction.update(db.collection('wallets').doc(agency.ownerId), {
      beans: admin.firestore.FieldValue.increment(commissionBeans),
      lifetimeBeansEarned: admin.firestore.FieldValue.increment(commissionBeans),
      updatedAt: now,
    });
  });

  // Track agency commission in analytics
  try {
    const { recordAgencyCommission } = await import('./analyticsService');
    await recordAgencyCommission(agencyId, hostId, commissionBeans, beansGenerated);
  } catch (anErr) {
    console.error('Failed to track agency commission in analytics:', anErr);
  }

  return commissionBeans;
};

export const getAgencyDashboard = async (agencyId: string): Promise<any> => {
  const agencySnap = await db.collection(AGENCIES).doc(agencyId).get();
  if (!agencySnap.exists) throw new Error('Agency not found');
  const agency = agencySnap.data()!;

  const hostsSnap = await db.collection(AGENCY_HOSTS)
    .where('agencyId', '==', agencyId)
    .where('status', '==', 'active')
    .get();

  const hostIds = hostsSnap.docs.map(doc => doc.data().hostId);

  // Fetch host details
  const hosts: any[] = [];
  if (hostIds.length > 0) {
    const usersSnap = await db.collection(USERS)
      .where(admin.firestore.FieldPath.documentId(), 'in', hostIds.slice(0, 10))
      .get();
      
    usersSnap.docs.forEach(doc => {
      hosts.push({ uid: doc.id, ...doc.data() });
    });
  }

  return {
    agency,
    hosts,
  };
};
