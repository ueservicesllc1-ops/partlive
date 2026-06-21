import firestore from '@react-native-firebase/firestore';
import { MicRequest } from '../../../types';
import { getRoomMicRequestsPath, getRoomMembersPath } from '../../../constants/firestoreCollections';
import { assignSeat } from './roomMembersService';

export const requestMic = async (
  roomId: string,
  userProfile: { uid: string; displayName: string; photoURL?: string; username?: string }
): Promise<string> => {
  const db = firestore();
  const timestamp = firestore.FieldValue.serverTimestamp();
  const requestId = userProfile.uid; // One active request per user

  const newRequest: MicRequest = {
    id: requestId,
    roomId,
    userId: userProfile.uid,
    displayName: userProfile.displayName,
    username: userProfile.username,
    photoURL: userProfile.photoURL,
    status: 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.collection(getRoomMicRequestsPath(roomId)).doc(requestId).set(newRequest);
  return requestId;
};

export const cancelMicRequest = async (roomId: string, userId: string): Promise<void> => {
  await firestore()
    .collection(getRoomMicRequestsPath(roomId))
    .doc(userId)
    .delete();
};

export const getPendingMicRequests = async (roomId: string): Promise<MicRequest[]> => {
  const snap = await firestore()
    .collection(getRoomMicRequestsPath(roomId))
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'asc')
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MicRequest));
};

export const listenToPendingMicRequests = (roomId: string, callback: (requests: MicRequest[]) => void) => {
  return firestore()
    .collection(getRoomMicRequestsPath(roomId))
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'asc')
    .onSnapshot(snap => {
      if (snap) {
        callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MicRequest)));
      }
    });
};

export const approveMicRequest = async (
  roomId: string,
  requestId: string,
  moderatorId: string,
  seatIndex: number
): Promise<void> => {
  const db = firestore();
  const requestRef = db.collection(getRoomMicRequestsPath(roomId)).doc(requestId);

  const doc = await requestRef.get();
  if (doc.exists()) {
    // 1. Update request status to approved
    await requestRef.update({
      status: 'approved',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  // 2. Assign seat to user (will handle role change and update counts)
  await assignSeat(roomId, requestId, seatIndex);

  // 3. Remove request document
  if (doc.exists()) {
    await requestRef.delete();
  }
};

export const rejectMicRequest = async (roomId: string, requestId: string, moderatorId: string): Promise<void> => {
  const db = firestore();
  const requestRef = db.collection(getRoomMicRequestsPath(roomId)).doc(requestId);

  // For rejection, we simply delete the request document
  await requestRef.delete();
};
