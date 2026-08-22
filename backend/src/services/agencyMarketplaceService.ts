import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface AgencyInvitation {
  id: string;
  agencyId: string;
  hostId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: any;
}

export const inviteHostToAgency = async (agencyId: string, hostId: string): Promise<AgencyInvitation> => {
  const ref = db.collection('agencyInvitations').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const invitation: AgencyInvitation = {
    id: ref.id,
    agencyId,
    hostId,
    status: 'PENDING',
    createdAt: timestamp,
  };

  await ref.set(invitation);
  return invitation;
};

export const respondToAgencyInvitation = async (
  hostId: string,
  agencyId: string,
  accept: boolean
): Promise<{ success: boolean; agencyId: string }> => {
  const hostRef = db.collection('users').doc(hostId);
  const hostSnap = await hostRef.get();
  if (!hostSnap.exists) throw new Error(`HOST_NOT_FOUND: ${hostId}`);

  const currentAgency = hostSnap.data()?.agencyId;
  if (accept && currentAgency && currentAgency !== agencyId) {
    throw new Error('HOST_ALREADY_BOUND: Host is already bound to a primary agency. Leave current agency first.');
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  if (accept) {
    await hostRef.update({
      agencyId,
      agencyJoinedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  // Update invitations status
  const invSnap = await db.collection('agencyInvitations')
    .where('agencyId', '==', agencyId)
    .where('hostId', '==', hostId)
    .get();

  for (const doc of invSnap.docs) {
    await doc.ref.update({
      status: accept ? 'ACCEPTED' : 'DECLINED',
      updatedAt: timestamp,
    });
  }

  return { success: true, agencyId: accept ? agencyId : '' };
};

export const leaveAgency = async (hostId: string, agencyId: string): Promise<void> => {
  const hostRef = db.collection('users').doc(hostId);
  const hostSnap = await hostRef.get();

  if (hostSnap.exists && hostSnap.data()?.agencyId === agencyId) {
    await hostRef.update({
      agencyId: admin.firestore.FieldValue.delete(),
      agencyLeftAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
};
