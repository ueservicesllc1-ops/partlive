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
  data: Partial<Room> & { password?: string }
): Promise<string> => {
  const db = firestore();
  const timestamp = firestore.FieldValue.serverTimestamp();

  // Buscar si el usuario ya tiene una sala creada para reutilizarla
  const snapshot = await db
    .collection(FirestoreCollections.ROOMS)
    .where('ownerId', '==', ownerProfile.uid)
    .limit(1)
    .get();

  const roomRef = !snapshot.empty ? snapshot.docs[0].ref : db.collection(FirestoreCollections.ROOMS).doc();

  const defaultImages: Record<string, string> = {
    music: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=250',
    karaoke: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=250',
    party: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=250',
    games: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=250',
    talk: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=250',
    christian: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=250',
    podcast: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=250',
    debate: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=250',
    friends: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=250',
  };
  const categoryKey = data.category || 'talk';
  const coverImageUrl = data.coverImageUrl || defaultImages[categoryKey] || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=250';

  // If password was provided, we'll hash it or store it. For MVP, we can hash it on client or let backend update it.
  // We'll set the initial values based on feedback (listenersUnlimited is true, maxMics max 8).
  const newRoom: any = {
    ...data,
    coverImageUrl,
    titleLowercase: data.title ? data.title.trim().toLowerCase() : '',
    ownerId: ownerProfile.uid,
    hostId: ownerProfile.uid,
    ownerName: ownerProfile.displayName,
    ownerPhotoURL: ownerProfile.photoURL,
    hostIds: [ownerProfile.uid],
    moderatorIds: [],
    speakersCount: 1,
    listenersCount: 1,
    currentSpeakersCount: 1,
    currentListenersCount: 1,
    status: 'active',
    isLive: true,
    visibility: data.visibility || 'public',
    accessType: data.accessType || 'open',
    maxMics: data.maxMics || 8,
    listenersUnlimited: true,
    maxListeners: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (data.password && data.accessType === 'password') {
    // Hash local or store it simple/hashed
    newRoom.passwordHash = data.password; // Normally done via backend, client writes directly to draft DB
  }

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
  const updates: any = {
    ...data,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  if (data.title !== undefined) {
    updates.titleLowercase = data.title.trim().toLowerCase();
  }

  await firestore()
    .collection(FirestoreCollections.ROOMS)
    .doc(id)
    .update(updates);
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
      status: 'closed',
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
    if (memberSnap.exists()) {
      const memberData = memberSnap.data() as RoomMember;
      if (memberData.isKicked) {
        throw new Error('Has sido expulsado o baneado de esta sala.');
      }
    }
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

export const listenToActiveRooms = (callback: (rooms: Room[]) => void) => {
  return firestore()
    .collection(FirestoreCollections.ROOMS)
    .where('status', '==', 'active')
    .onSnapshot(
      snapshot => {
        if (snapshot) {
          const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
          callback(rooms);
        }
      },
      error => {
        console.error('Error listening to active rooms:', error);
      }
    );
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

export const lockSeat = async (roomId: string, seatIndex: number, actorUserId: string): Promise<void> => {
  const db = firestore();
  const roomRef = db.collection(FirestoreCollections.ROOMS).doc(roomId);
  const memberRef = db.collection(getRoomMembersPath(roomId)).doc(actorUserId);

  await db.runTransaction(async transaction => {
    const roomSnap = await transaction.get(roomRef);
    const memberSnap = await transaction.get(memberRef);

    if (!roomSnap.exists() || !memberSnap.exists()) {
      throw new Error('La sala o el miembro no existen.');
    }

    const roomData = roomSnap.data() as Room;
    const actorData = memberSnap.data() as RoomMember;

    const { hasRoomPermission } = require('../../../utils/roomPermissions');
    if (!hasRoomPermission(actorData.role, 'LOCK_MIC_SEAT')) {
      throw new Error('No tienes permisos para bloquear asientos.');
    }

    transaction.update(roomRef, {
      lockedSeats: firestore.FieldValue.arrayUnion(seatIndex),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });

  // If someone is occupying the seat, boot them off
  const membersSnap = await db
    .collection(getRoomMembersPath(roomId))
    .where('seatIndex', '==', seatIndex)
    .get();

  if (!membersSnap.empty) {
    const occupant = membersSnap.docs[0].data() as RoomMember;
    const { removeFromSeat } = require('./roomMembersService');
    await removeFromSeat(roomId, occupant.userId, actorUserId);
  }
};

export const unlockSeat = async (roomId: string, seatIndex: number, actorUserId: string): Promise<void> => {
  const db = firestore();
  const roomRef = db.collection(FirestoreCollections.ROOMS).doc(roomId);
  const memberRef = db.collection(getRoomMembersPath(roomId)).doc(actorUserId);

  await db.runTransaction(async transaction => {
    const roomSnap = await transaction.get(roomRef);
    const memberSnap = await transaction.get(memberRef);

    if (!roomSnap.exists() || !memberSnap.exists()) {
      throw new Error('La sala o el miembro no existen.');
    }

    const roomData = roomSnap.data() as Room;
    const actorData = memberSnap.data() as RoomMember;

    const { hasRoomPermission } = require('../../../utils/roomPermissions');
    if (!hasRoomPermission(actorData.role, 'UNLOCK_MIC_SEAT')) {
      throw new Error('No tienes permisos para desbloquear asientos.');
    }

    transaction.update(roomRef, {
      lockedSeats: firestore.FieldValue.arrayRemove(seatIndex),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });
};
