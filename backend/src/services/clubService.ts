import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface Club {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isHostFanClub: boolean;
  hostId?: string;
  privacy: 'public' | 'private' | 'invite_only';
  memberCount: number;
  status: 'active' | 'suspended';
  createdAt: any;
  updatedAt: any;
}

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: any;
}

export const createClub = async (
  ownerId: string,
  name: string,
  description: string,
  isHostFanClub: boolean = false,
  hostId?: string,
  privacy: 'public' | 'private' | 'invite_only' = 'public'
): Promise<Club> => {
  const ownerSnap = await db.collection('users').doc(ownerId).get();
  if (!ownerSnap.exists) throw new Error('Usuario propietario no encontrado.');

  const clubRef = db.collection('clubs').doc();
  const memberRef = clubRef.collection('members').doc(ownerId);
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const newClub: any = {
    id: clubRef.id,
    ownerId,
    name,
    description,
    isHostFanClub,
    hostId: isHostFanClub ? (hostId || ownerId) : '',
    privacy,
    memberCount: 1,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const newMember: ClubMember = {
    id: ownerId,
    clubId: clubRef.id,
    userId: ownerId,
    role: 'owner',
    joinedAt: timestamp,
  };

  const batch = db.batch();
  batch.set(clubRef, newClub);
  batch.set(memberRef, newMember);
  await batch.commit();

  return newClub;
};

export const joinClub = async (userId: string, clubId: string): Promise<void> => {
  const clubRef = db.collection('clubs').doc(clubId);
  const memberRef = clubRef.collection('members').doc(userId);

  await db.runTransaction(async (transaction) => {
    const clubSnap = await transaction.get(clubRef);
    if (!clubSnap.exists) throw new Error('Club no encontrado.');
    const club = clubSnap.data() as Club;

    if (club.status !== 'active') throw new Error('Este club no está activo.');

    const memberSnap = await transaction.get(memberRef);
    if (memberSnap.exists) throw new Error('Ya eres miembro de este club.');

    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    transaction.set(memberRef, {
      id: userId,
      clubId,
      userId,
      role: 'member',
      joinedAt: timestamp,
    });

    transaction.update(clubRef, {
      memberCount: admin.firestore.FieldValue.increment(1),
      updatedAt: timestamp,
    });
  });
};

export const getClubLeaderboard = async (clubId: string): Promise<any[]> => {
  const membersSnap = await db.collection('clubs').doc(clubId).collection('members').limit(50).get();
  const memberUserIds = membersSnap.docs.map((doc) => doc.data().userId);

  if (memberUserIds.length === 0) return [];

  // Fetch profiles for users in club
  const usersSnap = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', memberUserIds.slice(0, 10)).get();
  return usersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      userId: doc.id,
      displayName: data.displayName || 'Miembro',
      photoURL: data.photoURL || '',
      level: data.level || 1,
      vipLevel: data.vipLevel || 0,
      totalGiftsSent: data.totalGiftsSent || 0,
    };
  }).sort((a, b) => (b.vipLevel - a.vipLevel) || (b.level - a.level));
};
