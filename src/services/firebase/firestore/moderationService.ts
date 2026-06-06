import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { ModerationLog } from '../../../types';
import { nowServerTimestamp } from '../../../utils/firestoreDates';

export const createModerationLog = async (data: Omit<ModerationLog, 'id' | 'createdAt'>): Promise<string> => {
  const ref = await firestore().collection(FirestoreCollections.MODERATION_LOGS).add({
    ...data,
    createdAt: nowServerTimestamp(),
  });
  return ref.id;
};

export const getModerationLogsForTarget = async (targetType: string, targetId: string): Promise<ModerationLog[]> => {
  const snap = await firestore()
    .collection(FirestoreCollections.MODERATION_LOGS)
    .where('targetType', '==', targetType)
    .where('targetId', '==', targetId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ModerationLog));
};

export const logRoomModerationAction = async (
  roomId: string,
  data: {
    moderatorId: string;
    action: 'promote_host' | 'remove_host' | 'promote_moderator' | 'remove_moderator' | 'promote_speaker' | 'remove_speaker' | 'mute_member' | 'unmute_member' | 'kick_member' | 'hide_message' | 'close_room';
    targetUserId?: string;
    targetRoleBefore?: string;
    targetRoleAfter?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }
): Promise<string> => {
  const ref = await firestore()
    .collection('rooms')
    .doc(roomId)
    .collection('moderationLogs')
    .add({
      ...data,
      roomId,
      createdAt: nowServerTimestamp(),
    });
  return ref.id;
};
