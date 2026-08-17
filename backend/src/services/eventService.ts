import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface ScheduledEvent {
  id: string;
  title: string;
  description: string;
  category: 'KARAOKE' | 'PK' | 'TRIVIA' | 'TALENT' | 'PARTY';
  hostId: string;
  hostName: string;
  startTime: any;
  endTime?: any;
  coverUrl?: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  reminderCount: number;
  createdAt: any;
}

export const createScheduledEvent = async (
  hostId: string,
  title: string,
  description: string,
  category: 'KARAOKE' | 'PK' | 'TRIVIA' | 'TALENT' | 'PARTY',
  startTime: Date,
  coverUrl?: string
): Promise<ScheduledEvent> => {
  const hostSnap = await db.collection('users').doc(hostId).get();
  const hostName = hostSnap.exists ? (hostSnap.data()?.displayName || 'Anfitrión') : 'Anfitrión';

  const eventRef = db.collection('events').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const newEvent: ScheduledEvent = {
    id: eventRef.id,
    title,
    description,
    category,
    hostId,
    hostName,
    startTime: admin.firestore.Timestamp.fromDate(new Date(startTime)),
    coverUrl: coverUrl || '',
    status: 'SCHEDULED',
    reminderCount: 0,
    createdAt: timestamp,
  };

  await eventRef.set(newEvent);
  return newEvent;
};

export const toggleEventReminder = async (userId: string, eventId: string): Promise<{ isSubscribed: boolean }> => {
  const reminderRef = db.collection('eventReminders').doc(`${userId}_${eventId}`);
  const eventRef = db.collection('events').doc(eventId);

  let isSubscribed = false;

  await db.runTransaction(async (transaction) => {
    const reminderSnap = await transaction.get(reminderRef);

    if (reminderSnap.exists) {
      transaction.delete(reminderRef);
      transaction.update(eventRef, {
        reminderCount: admin.firestore.FieldValue.increment(-1),
      });
      isSubscribed = false;
    } else {
      transaction.set(reminderRef, {
        userId,
        eventId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      transaction.update(eventRef, {
        reminderCount: admin.firestore.FieldValue.increment(1),
      });
      isSubscribed = true;
    }
  });

  return { isSubscribed };
};

export const getUpcomingEvents = async (category?: string): Promise<ScheduledEvent[]> => {
  let query: admin.firestore.Query = db.collection('events')
    .where('status', '==', 'SCHEDULED')
    .limit(30);

  if (category && category !== 'ALL') {
    query = query.where('category', '==', category);
  }

  const snap = await query.get();
  return snap.docs.map((doc) => doc.data() as ScheduledEvent);
};
