import { db } from '../config/firebase';
import * as admin from 'firebase-admin';
import {
  KaraokeSong,
  KaraokeQueueItem,
  KaraokeSession,
  KaraokePerformance,
  KaraokeFavorite,
  KaraokeBattle,
} from '../types/karaoke';
import { buildKaraokeSongKeywords, normalizeKaraokeText } from '../utils/karaokeSearch';
import { createNotificationAndPush } from './notificationService';

// Permission Helper
async function checkSessionPermission(actorId: string, targetType: 'room' | 'live', targetId: string): Promise<void> {
  if (targetType === 'room') {
    const doc = await db.collection('rooms').doc(targetId).get();
    if (!doc.exists) throw new Error('Sala no encontrada.');
    const data = doc.data()!;
    const isAuth = data.ownerId === actorId ||
                   (data.hostIds && data.hostIds.includes(actorId)) ||
                   (data.moderatorIds && data.moderatorIds.includes(actorId));
    if (!isAuth) throw new Error('No tienes permisos en esta sala.');
  } else {
    const doc = await db.collection('lives').doc(targetId).get();
    if (!doc.exists) throw new Error('Live no encontrado.');
    const data = doc.data()!;
    const isAuth = data.hostId === actorId ||
                   (data.moderatorIds && data.moderatorIds.includes(actorId));
    if (!isAuth) throw new Error('No tienes permisos en este live.');
  }
}

// User Checks
async function validateUserCanSing(userId: string, targetType: 'room' | 'live', targetId: string): Promise<any> {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) throw new Error('Usuario no encontrado.');
  const userData = userDoc.data()!;

  if (userData.status === 'banned' || userData.status === 'suspended') {
    throw new Error('Tu cuenta está suspendida o baneada y no puedes cantar.');
  }

  // Check blocks with room/live owner
  let ownerId = '';
  if (targetType === 'room') {
    const roomDoc = await db.collection('rooms').doc(targetId).get();
    if (roomDoc.exists) ownerId = roomDoc.data()!.ownerId;
  } else {
    const liveDoc = await db.collection('lives').doc(targetId).get();
    if (liveDoc.exists) ownerId = liveDoc.data()!.hostId;
  }

  if (ownerId && ownerId !== userId) {
    const blockRef = db.collection('blocks').doc(`${ownerId}_${userId}`);
    const blockSnap = await blockRef.get();
    if (blockSnap.exists) {
      throw new Error('No tienes permiso para interactuar en esta sala.');
    }
  }

  return userData;
}

// ==========================================
// 1. SONGS CATALOG FUNCTIONS
// ==========================================

export async function getActiveSongs(filters?: { genre?: string; language?: string; query?: string }): Promise<KaraokeSong[]> {
  let query: admin.firestore.Query = db.collection('karaokeSongs').where('status', '==', 'active');

  if (filters?.genre) {
    query = query.where('genre', '==', filters.genre);
  }
  if (filters?.language) {
    query = query.where('language', '==', filters.language);
  }

  const snapshot = await query.get();
  let songs = snapshot.docs.map(doc => doc.data() as KaraokeSong);

  if (filters?.query) {
    const normQuery = normalizeKaraokeText(filters.query);
    songs = songs.filter(s => {
      const normTitle = normalizeKaraokeText(s.title || '');
      const normArtist = normalizeKaraokeText(s.artist || '');
      return normTitle.includes(normQuery) || normArtist.includes(normQuery);
    });
  }

  return songs;
}

export async function getSongById(songId: string): Promise<KaraokeSong> {
  const doc = await db.collection('karaokeSongs').doc(songId).get();
  if (!doc.exists) throw new Error('Canción no encontrada.');
  return doc.data() as KaraokeSong;
}

export async function createSong(actorId: string, data: Partial<KaraokeSong>): Promise<KaraokeSong> {
  const songRef = db.collection('karaokeSongs').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  // Validate actor (host uploads are pending_review, admin uploads are active)
  const actorDoc = await db.collection('users').doc(actorId).get();
  const role = actorDoc.exists ? actorDoc.data()!.role : 'user';
  const initialStatus = role === 'admin' ? 'active' : 'pending_review';

  const titleLowercase = data.title ? data.title.toLowerCase() : '';
  const artistLowercase = data.artist ? data.artist.toLowerCase() : '';

  const newSong: KaraokeSong = {
    id: songRef.id,
    title: data.title || 'Canción sin título',
    titleLowercase,
    artist: data.artist || 'Artista Desconocido',
    artistLowercase,
    language: data.language || 'es',
    genre: data.genre || 'Pop',
    durationSeconds: data.durationSeconds || 180,
    coverUrl: data.coverUrl || '',
    audioUrl: data.audioUrl || '',
    instrumentalUrl: data.instrumentalUrl || '',
    lyricsText: data.lyricsText || '',
    lyricsLrcUrl: data.lyricsLrcUrl || '',
    sourceType: data.sourceType || 'host_upload',
    sourceUrl: data.sourceUrl || '',
    uploadedBy: actorId,
    status: initialStatus,
    isFeatured: data.isFeatured || false,
    playCount: 0,
    tags: data.tags || [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // Generate keywords
  newSong.searchKeywords = buildKaraokeSongKeywords(newSong);

  await songRef.set(newSong);
  return { ...newSong, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateSong(songId: string, actorId: string, data: Partial<KaraokeSong>): Promise<void> {
  const ref = db.collection('karaokeSongs').doc(songId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Canción no encontrada.');

  const song = snap.data()!;
  const userDoc = await db.collection('users').doc(actorId).get();
  const role = userDoc.exists ? userDoc.data()!.role : 'user';

  if (role !== 'admin' && song.uploadedBy !== actorId) {
    throw new Error('Acción no autorizada.');
  }

  const updates: any = {
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (data.title) updates.titleLowercase = data.title.toLowerCase();
  if (data.artist) updates.artistLowercase = data.artist.toLowerCase();

  // Re-generate keywords if metadata changed
  const merged = { ...song, ...updates };
  updates.searchKeywords = buildKaraokeSongKeywords(merged);

  await ref.update(updates);
}

export async function approveSong(songId: string, adminId: string): Promise<void> {
  await db.collection('karaokeSongs').doc(songId).update({
    status: 'active',
    approvedBy: adminId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function rejectSong(songId: string, adminId: string, reason: string): Promise<void> {
  await db.collection('karaokeSongs').doc(songId).update({
    status: 'rejected',
    rejectedBy: adminId,
    rejectedReason: reason,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function incrementSongPlayCount(songId: string): Promise<void> {
  await db.collection('karaokeSongs').doc(songId).update({
    playCount: admin.firestore.FieldValue.increment(1),
  });
}

// ==========================================
// 2. SESSION CONTROL FUNCTIONS
// ==========================================

export async function startKaraokeSession(actorId: string, targetType: 'room' | 'live', targetId: string): Promise<KaraokeSession> {
  await checkSessionPermission(actorId, targetType, targetId);

  // Check if session already active
  const activeSnap = await db.collection('karaokeSessions')
    .where(targetType === 'room' ? 'roomId' : 'liveId', '==', targetId)
    .where('status', '==', 'active')
    .get();

  if (!activeSnap.empty) {
    return activeSnap.docs[0].data() as KaraokeSession;
  }

  const sessionRef = db.collection('karaokeSessions').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const newSession: KaraokeSession = {
    id: sessionRef.id,
    roomId: targetType === 'room' ? targetId : undefined,
    liveId: targetType === 'live' ? targetId : undefined,
    hostId: actorId,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    startedAt: timestamp,
  };

  await sessionRef.set(newSession);

  // Send Push Alert for new Karaoke Sessions
  const bodyText = targetType === 'room' ? '¡Se ha iniciado una sesión de Karaoke en la sala de voz!' : '¡El streamer ha activado el Karaoke!';
  await createNotificationAndPush({
    userId: actorId, // Trigger/source
    type: 'event_started',
    channel: 'both',
    title: '🎤 Karaoke en Vivo',
    body: bodyText,
    actionType: targetType === 'room' ? 'open_room' : 'open_live',
    actionValue: targetId,
  });

  return { ...newSession, createdAt: new Date(), updatedAt: new Date(), startedAt: new Date() };
}

export async function endKaraokeSession(actorId: string, sessionId: string): Promise<void> {
  const ref = db.collection('karaokeSessions').doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Sesión no encontrada.');
  const session = snap.data() as KaraokeSession;

  await checkSessionPermission(actorId, session.roomId ? 'room' : 'live', session.roomId || session.liveId!);

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  batch.update(ref, {
    status: 'ended',
    endedAt: timestamp,
    updatedAt: timestamp,
  });

  // Cancel any remaining items in queue
  const queueSnap = await db.collection('karaokeQueue')
    .where('sessionId', '==', sessionId)
    .where('status', 'in', ['pending', 'approved', 'singing'])
    .get();

  queueSnap.forEach(doc => {
    batch.update(doc.ref, {
      status: 'cancelled',
      completedAt: timestamp,
    });
  });

  await batch.commit();
}

export async function getActiveKaraokeSession(targetType: 'room' | 'live', targetId: string): Promise<KaraokeSession | null> {
  const snap = await db.collection('karaokeSessions')
    .where(targetType === 'room' ? 'roomId' : 'liveId', '==', targetId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0].data() as KaraokeSession;
}

// ==========================================
// 3. SING QUEUE FUNCTIONS
// ==========================================

export async function requestSong(userId: string, targetType: 'room' | 'live', targetId: string, songId: string): Promise<KaraokeQueueItem> {
  const user = await validateUserCanSing(userId, targetType, targetId);
  const song = await getSongById(songId);

  const session = await getActiveKaraokeSession(targetType, targetId);
  if (!session) throw new Error('No hay ninguna sesión de Karaoke activa en esta sala.');

  // Check duplicate song requests in queue
  const duplicateSnap = await db.collection('karaokeQueue')
    .where('sessionId', '==', session.id)
    .where('singerId', '==', userId)
    .where('songId', '==', songId)
    .where('status', 'in', ['pending', 'approved'])
    .get();

  if (!duplicateSnap.empty) {
    throw new Error('Ya tienes esta misma canción en cola.');
  }

  // Get current position
  const queueSnap = await db.collection('karaokeQueue')
    .where('sessionId', '==', session.id)
    .where('status', 'in', ['pending', 'approved'])
    .get();
  
  const position = queueSnap.size + 1;

  const queueRef = db.collection('karaokeQueue').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const newQueueItem: KaraokeQueueItem = {
    id: queueRef.id,
    roomId: session.roomId,
    liveId: session.liveId,
    sessionId: session.id,
    songId,
    songTitle: song.title,
    singerId: userId,
    singerName: user.displayName || user.username || 'Usuario',
    singerPhotoURL: user.photoURL || '',
    status: 'pending',
    position,
    requestedAt: timestamp,
  };

  await queueRef.set(newQueueItem);
  return { ...newQueueItem, requestedAt: new Date() };
}

export async function approveQueueItem(actorId: string, queueItemId: string): Promise<void> {
  const ref = db.collection('karaokeQueue').doc(queueItemId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Elemento de cola no encontrado.');
  const item = snap.data() as KaraokeQueueItem;

  await checkSessionPermission(actorId, item.roomId ? 'room' : 'live', item.roomId || item.liveId!);

  await ref.update({
    status: 'approved',
    approvedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Notify singer
  await createNotificationAndPush({
    userId: actorId,
    type: 'system',
    channel: 'in_app',
    title: '🎤 Turno Aprobado',
    body: `Tu solicitud para cantar "${item.songTitle}" fue aprobada.`,
    actionType: item.roomId ? 'open_room' : 'open_live',
    actionValue: item.roomId || item.liveId,
  });
}

export async function rejectQueueItem(actorId: string, queueItemId: string, reason: string): Promise<void> {
  const ref = db.collection('karaokeQueue').doc(queueItemId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Elemento de cola no encontrado.');
  const item = snap.data() as KaraokeQueueItem;

  await checkSessionPermission(actorId, item.roomId ? 'room' : 'live', item.roomId || item.liveId!);

  await ref.update({
    status: 'rejected',
    rejectedReason: reason,
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function skipQueueItem(actorId: string, queueItemId: string): Promise<void> {
  const ref = db.collection('karaokeQueue').doc(queueItemId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Elemento de cola no encontrado.');
  const item = snap.data() as KaraokeQueueItem;

  await checkSessionPermission(actorId, item.roomId ? 'room' : 'live', item.roomId || item.liveId!);

  await ref.update({
    status: 'skipped',
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function startQueueItem(actorId: string, queueItemId: string): Promise<void> {
  const ref = db.collection('karaokeQueue').doc(queueItemId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Elemento de cola no encontrado.');
  const item = snap.data() as KaraokeQueueItem;

  await checkSessionPermission(actorId, item.roomId ? 'room' : 'live', item.roomId || item.liveId!);

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  // 1. Mark this item as singing
  batch.update(ref, {
    status: 'singing',
    startedAt: timestamp,
  });

  // 2. Update session with active singer metadata
  const sessionRef = db.collection('karaokeSessions').doc(item.sessionId);
  batch.update(sessionRef, {
    currentQueueItemId: queueItemId,
    currentSongId: item.songId,
    currentSingerId: item.singerId,
    updatedAt: timestamp,
  });

  await batch.commit();

  // Increment playCount
  await incrementSongPlayCount(item.songId);

  // Notify singer it's their turn
  await createNotificationAndPush({
    userId: actorId,
    type: 'system',
    channel: 'both',
    title: '🎤 ¡Es tu Turno!',
    body: `¡Prepárate! Ya estás en el micrófono cantando "${item.songTitle}".`,
    actionType: item.roomId ? 'open_room' : 'open_live',
    actionValue: item.roomId || item.liveId,
  });
}

export async function completeQueueItem(actorId: string, queueItemId: string): Promise<void> {
  const ref = db.collection('karaokeQueue').doc(queueItemId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Elemento de cola no encontrado.');
  const item = snap.data() as KaraokeQueueItem;

  await checkSessionPermission(actorId, item.roomId ? 'room' : 'live', item.roomId || item.liveId!);

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  batch.update(ref, {
    status: 'completed',
    completedAt: timestamp,
  });

  // Clear session active metadata
  const sessionRef = db.collection('karaokeSessions').doc(item.sessionId);
  batch.update(sessionRef, {
    currentQueueItemId: admin.firestore.FieldValue.delete(),
    currentSongId: admin.firestore.FieldValue.delete(),
    currentSingerId: admin.firestore.FieldValue.delete(),
    updatedAt: timestamp,
  });

  await batch.commit();

  // Create performance statistics records
  await createPerformanceFromQueueItem(queueItemId);
}

export async function reorderQueue(actorId: string, sessionId: string, orderedIds: string[]): Promise<void> {
  const sessionDoc = await db.collection('karaokeSessions').doc(sessionId).get();
  if (!sessionDoc.exists) throw new Error('Sesión no encontrada.');
  const session = sessionDoc.data() as KaraokeSession;

  await checkSessionPermission(actorId, session.roomId ? 'room' : 'live', session.roomId || session.liveId!);

  const batch = db.batch();
  orderedIds.forEach((id, idx) => {
    const itemRef = db.collection('karaokeQueue').doc(id);
    batch.update(itemRef, {
      position: idx + 1,
    });
  });

  await batch.commit();
}

export async function getQueue(sessionId: string): Promise<KaraokeQueueItem[]> {
  const snap = await db.collection('karaokeQueue')
    .where('sessionId', '==', sessionId)
    .where('status', 'in', ['pending', 'approved', 'singing'])
    .orderBy('position', 'asc')
    .get();

  return snap.docs.map(doc => doc.data() as KaraokeQueueItem);
}

export async function getMyQueueItems(userId: string): Promise<KaraokeQueueItem[]> {
  const snap = await db.collection('karaokeQueue')
    .where('singerId', '==', userId)
    .where('status', 'in', ['pending', 'approved', 'singing'])
    .get();

  return snap.docs.map(doc => doc.data() as KaraokeQueueItem);
}

// ==========================================
// 4. PERFORMANCE TRACKING
// ==========================================

export async function createPerformanceFromQueueItem(queueItemId: string): Promise<KaraokePerformance> {
  const queueDoc = await db.collection('karaokeQueue').doc(queueItemId).get();
  if (!queueDoc.exists) throw new Error('Turno no encontrado.');
  const queue = queueDoc.data() as KaraokeQueueItem;

  const performanceRef = db.collection('karaokePerformances').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const newPerformance: KaraokePerformance = {
    id: performanceRef.id,
    sessionId: queue.sessionId,
    roomId: queue.roomId,
    liveId: queue.liveId,
    songId: queue.songId,
    singerId: queue.singerId,
    singerName: queue.singerName,
    giftsReceivedDiamonds: 0,
    beansGenerated: 0,
    createdAt: timestamp,
    completedAt: timestamp,
  };

  await performanceRef.set(newPerformance);

  // Safely trigger mission completion progress
  try {
    const { incrementMissionProgress } = await import('./missionService');
    await incrementMissionProgress(queue.singerId, 'karaoke_participation', 1);
  } catch (err) {
    console.error('Failed to trigger karaoke mission progress:', err);
  }

  return { ...newPerformance, createdAt: new Date(), completedAt: new Date() };
}

export async function updatePerformanceGifts(performanceId: string, diamonds: number, beans: number): Promise<void> {
  await db.collection('karaokePerformances').doc(performanceId).update({
    giftsReceivedDiamonds: admin.firestore.FieldValue.increment(diamonds),
    beansGenerated: admin.firestore.FieldValue.increment(beans),
  });
}

export async function finishPerformance(performanceId: string, data: { durationSeconds?: number; score?: number }): Promise<void> {
  await db.collection('karaokePerformances').doc(performanceId).update({
    ...data,
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function getSingerPerformances(userId: string): Promise<KaraokePerformance[]> {
  const snap = await db.collection('karaokePerformances')
    .where('singerId', '==', userId)
    .orderBy('completedAt', 'desc')
    .limit(20)
    .get();

  return snap.docs.map(doc => doc.data() as KaraokePerformance);
}

// ==========================================
// 5. FAVORITES FUNCTIONS
// ==========================================

export async function addFavoriteSong(userId: string, songId: string): Promise<void> {
  const id = `${userId}_${songId}`;
  await db.collection('karaokeFavorites').doc(id).set({
    id,
    userId,
    songId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function removeFavoriteSong(userId: string, songId: string): Promise<void> {
  const id = `${userId}_${songId}`;
  await db.collection('karaokeFavorites').doc(id).delete();
}

export async function getFavoriteSongs(userId: string): Promise<KaraokeSong[]> {
  const favsSnap = await db.collection('karaokeFavorites').where('userId', '==', userId).get();
  const songIds = favsSnap.docs.map(doc => doc.data().songId);

  if (songIds.length === 0) return [];

  // Firestore in queries are limited to 10 elements. Let's load the active catalog and filter
  const allSongs = await getActiveSongs();
  return allSongs.filter(song => songIds.includes(song.id));
}

// ==========================================
// 6. BATTLES FUNCTIONS
// ==========================================

export async function createKaraokeBattle(actorId: string, data: Partial<KaraokeBattle>): Promise<KaraokeBattle> {
  const battleRef = db.collection('karaokeBattles').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const newBattle: KaraokeBattle = {
    id: battleRef.id,
    title: data.title || 'Batalla de Karaoke',
    description: data.description || '',
    roomId: data.roomId,
    liveId: data.liveId,
    eventId: data.eventId,
    status: 'scheduled',
    participantIds: data.participantIds || [],
    votingEnabled: false,
    startsAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await battleRef.set(newBattle);
  return { ...newBattle, createdAt: new Date(), updatedAt: new Date(), startsAt: new Date() };
}

export async function joinKaraokeBattle(userId: string, battleId: string): Promise<void> {
  const ref = db.collection('karaokeBattles').doc(battleId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Batalla no encontrada.');
  const battle = snap.data() as KaraokeBattle;

  if (battle.status !== 'scheduled' && battle.status !== 'active') {
    throw new Error('No es posible unirse a la batalla en este momento.');
  }

  const participants = battle.participantIds || [];
  if (participants.includes(userId)) return;

  participants.push(userId);
  await ref.update({
    participantIds: participants,
    status: 'active',
    votingEnabled: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function voteKaraokeBattle(voterId: string, battleId: string, participantId: string): Promise<void> {
  const battleDoc = await db.collection('karaokeBattles').doc(battleId).get();
  if (!battleDoc.exists) throw new Error('Batalla no encontrada.');
  const battle = battleDoc.data() as KaraokeBattle;

  if (!battle.votingEnabled || battle.status !== 'active') {
    throw new Error('Las votaciones no están abiertas para esta batalla.');
  }

  if (!battle.participantIds.includes(participantId)) {
    throw new Error('El cantante seleccionado no participa en esta batalla.');
  }

  // Prevent multiple votes
  const id = `${battleId}_${voterId}`;
  const voteRef = db.collection('karaokeVotes').doc(id);
  const voteSnap = await voteRef.get();
  if (voteSnap.exists) {
    throw new Error('Ya has emitido tu voto para esta batalla.');
  }

  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  await voteRef.set({
    id,
    battleId,
    voterId,
    participantId,
    createdAt: timestamp,
  });
}

export async function endKaraokeBattle(actorId: string, battleId: string): Promise<any> {
  const ref = db.collection('karaokeBattles').doc(battleId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Batalla no encontrada.');
  const battle = snap.data() as KaraokeBattle;

  await checkSessionPermission(actorId, battle.roomId ? 'room' : 'live', battle.roomId || battle.liveId!);

  const winnerId = await calculateBattleWinner(battleId);

  await ref.update({
    status: 'ended',
    votingEnabled: false,
    winnerId: winnerId || null,
    endedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { winnerId };
}

export async function calculateBattleWinner(battleId: string): Promise<string | null> {
  const votesSnap = await db.collection('karaokeVotes').where('battleId', '==', battleId).get();
  const votesMap: Record<string, number> = {};

  votesSnap.forEach(doc => {
    const data = doc.data();
    votesMap[data.participantId] = (votesMap[data.participantId] || 0) + 1;
  });

  let winnerId: string | null = null;
  let maxVotes = 0;

  Object.keys(votesMap).forEach(uid => {
    if (votesMap[uid] > maxVotes) {
      maxVotes = votesMap[uid];
      winnerId = uid;
    }
  });

  return winnerId;
}
