import firestore from '@react-native-firebase/firestore';
import { Room, RoomMember } from '../../../types';
import { FirestoreCollections, getRoomMembersPath } from '../../../constants/firestoreCollections';

export const getActiveRooms = async (): Promise<Room[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.ROOMS)
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
};

export const getPopularRooms = async (): Promise<Room[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.ROOMS)
    .where('status', '==', 'active')
    .orderBy('listenersCount', 'desc')
    .limit(20)
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
};

export const getRoomsByCategory = async (category: string): Promise<Room[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.ROOMS)
    .where('status', '==', 'active')
    .where('category', '==', category)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
};

export const searchRooms = async (query: string): Promise<Room[]> => {
  const snapshot = await firestore()
    .collection(FirestoreCollections.ROOMS)
    .where('status', '==', 'active')
    .get();

  const allActive = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
  const lowerQuery = query.toLowerCase();
  return allActive.filter(
    room =>
      room.title.toLowerCase().includes(lowerQuery) ||
      (room.description && room.description.toLowerCase().includes(lowerQuery)) ||
      (room.tags && room.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
  );
};

export const getRoomById = async (id: string): Promise<Room | null> => {
  const doc = await firestore().collection(FirestoreCollections.ROOMS).doc(id).get();
  if (doc.exists()) {
    return { id: doc.id, ...doc.data() } as Room;
  }
  return null;
};

export const createRoom = async (
  ownerProfile: { uid: string; displayName: string; photoURL?: string; username?: string },
  data: Omit<Room, 'id' | 'ownerId' | 'ownerName' | 'ownerPhotoURL' | 'createdAt' | 'updatedAt' | 'speakersCount' | 'listenersCount' | 'status' | 'isLive'>
): Promise<string> => {
  const db = firestore();
  const timestamp = firestore.FieldValue.serverTimestamp();
  const roomRef = db.collection(FirestoreCollections.ROOMS).doc();

  const newRoom: Omit<Room, 'id'> = {
    ...data,
    ownerId: ownerProfile.uid,
    ownerName: ownerProfile.displayName,
    ownerPhotoURL: ownerProfile.photoURL,
    hostIds: [ownerProfile.uid],
    moderatorIds: [],
    speakersCount: 1,
    listenersCount: 1,
    status: 'active',
    isLive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const memberData: RoomMember = {
    id: ownerProfile.uid,
    roomId: roomRef.id,
    userId: ownerProfile.uid,
    displayName: ownerProfile.displayName,
    username: ownerProfile.username,
    photoURL: ownerProfile.photoURL,
    role: 'owner',
    seatIndex: 0,
    isMuted: false,
    joinedAt: timestamp,
    lastActiveAt: timestamp,
  };

  const batch = db.batch();
  batch.set(roomRef, newRoom);
  batch.set(db.collection(getRoomMembersPath(roomRef.id)).doc(ownerProfile.uid), memberData);
  await batch.commit();

  return roomRef.id;
};

export const updateRoom = async (id: string, data: Partial<Room>): Promise<void> => {
  await firestore()
    .collection(FirestoreCollections.ROOMS)
    .doc(id)
    .update({
      ...data,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
};

export const endRoom = async (roomId: string, userId: string): Promise<void> => {
  const room = await getRoomById(roomId);
  if (!room || room.ownerId !== userId) {
    throw new Error('Only the owner can end the room');
  }

  await firestore()
    .collection(FirestoreCollections.ROOMS)
    .doc(roomId)
    .update({
      status: 'ended',
      isLive: false,
      endedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

  const { logRoomModerationAction } = await import('./moderationService');
  const { sendRoomSystemMessage } = await import('./messagesService');
  await logRoomModerationAction(roomId, {
    moderatorId: userId,
    action: 'close_room',
  });
  await sendRoomSystemMessage(roomId, 'La sala fue cerrada.');
};

export const joinRoom = async (
  roomId: string,
  userProfile: { uid: string; displayName: string; photoURL?: string; username?: string }
): Promise<void> => {
  const db = firestore();
  const roomRef = db.collection(FirestoreCollections.ROOMS).doc(roomId);
  const memberRef = db.collection(getRoomMembersPath(roomId)).doc(userProfile.uid);

  await db.runTransaction(async transaction => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) {
      throw new Error('Room does not exist');
    }

    const roomData = roomSnap.data() as Room;
    if (roomData.status !== 'active') {
      throw new Error('Room is not active');
    }

    const memberSnap = await transaction.get(memberRef);
    const isAlreadyMember = memberSnap.exists();

    const timestamp = firestore.FieldValue.serverTimestamp();
    const newMember: RoomMember = {
      id: userProfile.uid,
      roomId,
      userId: userProfile.uid,
      displayName: userProfile.displayName,
      username: userProfile.username,
      photoURL: userProfile.photoURL,
      role: roomData.ownerId === userProfile.uid ? 'owner' : 'listener',
      isMuted: false,
      joinedAt: isAlreadyMember ? memberSnap.data()?.joinedAt || timestamp : timestamp,
      lastActiveAt: timestamp,
    };

    transaction.set(memberRef, newMember);

    if (!isAlreadyMember) {
      const incrementValue = 1;
      transaction.update(roomRef, {
        listenersCount: firestore.FieldValue.increment(incrementValue),
        updatedAt: timestamp,
      });
    }
  });
};

export const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
  const db = firestore();
  const roomRef = db.collection(FirestoreCollections.ROOMS).doc(roomId);
  const memberRef = db.collection(getRoomMembersPath(roomId)).doc(userId);

  await db.runTransaction(async transaction => {
    const roomSnap = await transaction.get(roomRef);
    const memberSnap = await transaction.get(memberRef);

    if (!memberSnap.exists()) {
      return; // Already left
    }

    const memberData = memberSnap.data() as RoomMember;
    const isSpeaker = memberData.seatIndex !== undefined || ['owner', 'host', 'speaker'].includes(memberData.role);

    transaction.delete(memberRef);

    if (roomSnap.exists()) {
      const timestamp = firestore.FieldValue.serverTimestamp();
      transaction.update(roomRef, {
        listenersCount: isSpeaker ? firestore.FieldValue.increment(0) : firestore.FieldValue.increment(-1),
        speakersCount: isSpeaker ? firestore.FieldValue.increment(-1) : firestore.FieldValue.increment(0),
        updatedAt: timestamp,
      });
    }
  });
};

export const listenToRoom = (roomId: string, callback: (room: Room | null) => void) => {
  return firestore()
    .collection(FirestoreCollections.ROOMS)
    .doc(roomId)
    .onSnapshot(doc => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Room);
      } else {
        callback(null);
      }
    });
};

export const listenToRoomMembers = (roomId: string, callback: (members: RoomMember[]) => void) => {
  return firestore()
    .collection(getRoomMembersPath(roomId))
    .orderBy('joinedAt', 'asc')
    .onSnapshot(snapshot => {
      if (snapshot) {
        const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoomMember));
        callback(members);
      }
    });
};

export const updateRoomCounts = async (roomId: string): Promise<void> => {
  const db = firestore();
  const membersSnap = await db.collection(getRoomMembersPath(roomId)).get();
  const members = membersSnap.docs.map(d => d.data() as RoomMember);

  let speakers = 0;
  let listeners = 0;

  members.forEach(m => {
    if (m.seatIndex !== undefined || ['owner', 'host', 'speaker'].includes(m.role)) {
      speakers++;
    } else {
      listeners++;
    }
  });

  await db.collection(FirestoreCollections.ROOMS).doc(roomId).update({
    speakersCount: speakers,
    listenersCount: listeners,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};
