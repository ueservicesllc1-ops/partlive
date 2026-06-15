import { db } from '../config/firebase';
import { normalizeSearchText, startsWithSearchRange } from '../utils/searchNormalize';
import * as admin from 'firebase-admin';

export interface BackendSearchFilter {
  entityTypes: string[];
  query?: string;
  country?: string;
  language?: string;
  category?: string;
  status?: string;
  sortBy?: string;
}

export const searchAllBackend = async (userId: string, filters: BackendSearchFilter) => {
  const queryText = filters.query ? normalizeSearchText(filters.query) : '';

  // 1. Check if the query contains any blocked search terms
  if (queryText) {
    const blockedSnapshot = await db.collection('blockedSearchTerms')
      .where('isActive', '==', true)
      .get();
    
    const isBlocked = blockedSnapshot.docs.some(doc => {
      const data = doc.data();
      const termNormalized = normalizeSearchText(data.term);
      return queryText.includes(termNormalized);
    });

    if (isBlocked) {
      return []; // Return empty array or filter out if matches blocked term
    }
  }

  const results: any[] = [];
  const entityTypes = filters.entityTypes?.length > 0 
    ? filters.entityTypes 
    : ['user', 'room', 'live', 'game', 'event', 'agency'];

  const promises: Promise<any>[] = [];

  // Users & Hosts search
  if (entityTypes.includes('user') || entityTypes.includes('host')) {
    let usersQuery = db.collection('users').where('status', '==', 'active');
    
    if (entityTypes.includes('host') && !entityTypes.includes('user')) {
      usersQuery = usersQuery.where('isHost', '==', true);
    }
    if (filters.country) {
      usersQuery = usersQuery.where('country', '==', filters.country);
    }
    if (filters.language) {
      usersQuery = usersQuery.where('language', '==', filters.language);
    }
    if (queryText) {
      const range = startsWithSearchRange(queryText);
      usersQuery = usersQuery
        .where('usernameLowercase', '>=', range.start)
        .where('usernameLowercase', '<=', range.end);
    }
    
    promises.push(usersQuery.limit(20).get().then(snap => snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.isHost ? 'host' : 'user',
        title: data.displayName || data.username || 'Usuario',
        subtitle: data.username ? `@${data.username}` : undefined,
        description: data.bio || '',
        imageUrl: data.photoURL || undefined,
        username: data.username,
        country: data.country,
        language: data.language,
        score: data.followersCount || 0,
        metadata: {
          isHost: !!data.isHost,
          isVip: !!data.isVip,
          followersCount: data.followersCount || 0,
          level: data.level || 1
        }
      };
    })));
  }

  // Rooms search
  if (entityTypes.includes('room')) {
    let roomsQuery = db.collection('rooms').where('status', '==', 'active');
    if (filters.country) {
      roomsQuery = roomsQuery.where('country', '==', filters.country);
    }
    if (filters.language) {
      roomsQuery = roomsQuery.where('language', '==', filters.language);
    }
    if (filters.category) {
      roomsQuery = roomsQuery.where('category', '==', filters.category);
    }
    if (queryText) {
      const range = startsWithSearchRange(queryText);
      roomsQuery = roomsQuery
        .where('titleLowercase', '>=', range.start)
        .where('titleLowercase', '<=', range.end);
    }

    promises.push(roomsQuery.limit(20).get().then(snap => snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'room',
        title: data.title || 'Sala de voz',
        subtitle: data.hostName ? `Host: ${data.hostName}` : undefined,
        description: data.description || '',
        imageUrl: data.coverUrl || data.hostPhoto || undefined,
        country: data.country,
        language: data.language,
        category: data.category,
        score: data.listenersCount || 0,
        metadata: {
          listenersCount: data.listenersCount || 0,
          giftsCount: data.giftsCount || 0,
          isLive: !!data.isLive
        }
      };
    })));
  }

  // Lives search
  if (entityTypes.includes('live')) {
    let livesQuery = db.collection('lives').where('status', '==', 'live');
    if (filters.country) {
      livesQuery = livesQuery.where('country', '==', filters.country);
    }
    if (filters.language) {
      livesQuery = livesQuery.where('language', '==', filters.language);
    }
    if (filters.category) {
      livesQuery = livesQuery.where('category', '==', filters.category);
    }
    if (queryText) {
      const range = startsWithSearchRange(queryText);
      livesQuery = livesQuery
        .where('titleLowercase', '>=', range.start)
        .where('titleLowercase', '<=', range.end);
    }

    promises.push(livesQuery.limit(20).get().then(snap => snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'live',
        title: data.title || 'Live Stream',
        subtitle: data.hostName ? `@${data.hostName}` : undefined,
        description: data.description || '',
        imageUrl: data.coverUrl || data.hostPhoto || undefined,
        country: data.country,
        language: data.language,
        category: data.category,
        score: data.viewersCount || 0,
        metadata: {
          viewersCount: data.viewersCount || 0,
          giftsCount: data.giftsCount || 0
        }
      };
    })));
  }

  // Games search
  if (entityTypes.includes('game')) {
    let gamesQuery = db.collection('games').where('isActive', '==', true);
    if (filters.category) {
      gamesQuery = gamesQuery.where('category', '==', filters.category);
    }
    if (queryText) {
      const range = startsWithSearchRange(queryText);
      gamesQuery = gamesQuery
        .where('titleLowercase', '>=', range.start)
        .where('titleLowercase', '<=', range.end);
    }

    promises.push(gamesQuery.limit(20).get().then(snap => snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'game',
        title: data.title || 'Juego',
        subtitle: data.category,
        description: data.description || '',
        imageUrl: data.iconUrl || data.coverUrl || undefined,
        category: data.category,
        metadata: {
          type: data.type,
          isActive: !!data.isActive
        }
      };
    })));
  }

  // Events search
  if (entityTypes.includes('event')) {
    let eventsQuery = db.collection('events').where('status', '==', 'active');
    if (filters.country) {
      eventsQuery = eventsQuery.where('country', '==', filters.country);
    }
    if (filters.language) {
      eventsQuery = eventsQuery.where('language', '==', filters.language);
    }
    if (queryText) {
      const range = startsWithSearchRange(queryText);
      eventsQuery = eventsQuery
        .where('titleLowercase', '>=', range.start)
        .where('titleLowercase', '<=', range.end);
    }

    promises.push(eventsQuery.limit(20).get().then(snap => snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'event',
        title: data.title || 'Evento Especial',
        subtitle: data.type,
        description: data.description || '',
        imageUrl: data.bannerUrl || undefined,
        country: data.country,
        language: data.language,
        category: data.category,
        metadata: {
          startsAt: data.startsAt ? data.startsAt.toDate() : null,
          endsAt: data.endsAt ? data.endsAt.toDate() : null,
          status: data.status
        }
      };
    })));
  }

  // Agencies search
  if (entityTypes.includes('agency')) {
    let agenciesQuery = db.collection('agencies').where('status', '==', 'active');
    if (filters.country) {
      agenciesQuery = agenciesQuery.where('country', '==', filters.country);
    }
    if (queryText) {
      const range = startsWithSearchRange(queryText);
      agenciesQuery = agenciesQuery
        .where('nameLowercase', '>=', range.start)
        .where('nameLowercase', '<=', range.end);
    }

    promises.push(agenciesQuery.limit(20).get().then(snap => snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'agency',
        title: data.name || 'Agencia',
        subtitle: `Hosts: ${data.totalHosts || 0}`,
        description: data.description || '',
        imageUrl: data.logoUrl || undefined,
        country: data.country,
        metadata: {
          totalHosts: data.totalHosts || 0,
          totalBeansGenerated: data.totalBeansGenerated || 0
        }
      };
    })));
  }

  const subResults = await Promise.all(promises);
  subResults.forEach(list => results.push(...list));

  // Sort logic backend-side
  results.sort((a, b) => {
    switch (filters.sortBy) {
      case 'popular':
        return (b.score || 0) - (a.score || 0);
      case 'recent': {
        const dateA = a.metadata?.startsAt || a.metadata?.createdAt || 0;
        const dateB = b.metadata?.startsAt || b.metadata?.createdAt || 0;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
      case 'viewers': {
        const viewA = a.metadata?.viewersCount || a.metadata?.listenersCount || 0;
        const viewB = b.metadata?.viewersCount || b.metadata?.listenersCount || 0;
        return viewB - viewA;
      }
      case 'followers': {
        const followA = a.metadata?.followersCount || 0;
        const followB = b.metadata?.followersCount || 0;
        return followB - followA;
      }
      case 'gifts': {
        const giftA = a.metadata?.giftsCount || a.metadata?.totalBeansGenerated || 0;
        const giftB = b.metadata?.giftsCount || b.metadata?.totalBeansGenerated || 0;
        return giftB - giftA;
      }
      default:
        return (b.score || 0) - (a.score || 0);
    }
  });

  // Save recent search if query is not empty
  if (queryText) {
    await saveRecentSearchBackend(userId, filters.query!, filters);
  }

  return results;
};

export const saveRecentSearchBackend = async (userId: string, query: string, filters?: any) => {
  const cleanQuery = query.trim();
  if (!cleanQuery || !userId) return;

  const collectionRef = db.collection('recentSearches');
  const querySnapshot = await collectionRef
    .where('userId', '==', userId)
    .where('query', '==', cleanQuery)
    .limit(1)
    .get();

  if (!querySnapshot.empty) {
    const docId = querySnapshot.docs[0].id;
    await collectionRef.doc(docId).update({
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    await collectionRef.add({
      userId,
      query: cleanQuery,
      filters: filters || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // Update trending
  const trendingRef = db.collection('trendingSearches');
  const trendingSnapshot = await trendingRef
    .where('query', '==', cleanQuery)
    .limit(1)
    .get();

  if (!trendingSnapshot.empty) {
    const docId = trendingSnapshot.docs[0].id;
    await trendingRef.doc(docId).update({
      count: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    await trendingRef.add({
      query: cleanQuery,
      count: 1,
      country: filters?.country || null,
      language: filters?.language || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
};

export const getRecentSearchesBackend = async (userId: string) => {
  const snapshot = await db.collection('recentSearches')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      query: data.query,
      filters: data.filters,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
    };
  });
};

export const clearRecentSearchesBackend = async (userId: string) => {
  const snapshot = await db.collection('recentSearches')
    .where('userId', '==', userId)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};

export const getTrendingSearchesBackend = async (country?: string, language?: string) => {
  let queryRef = db.collection('trendingSearches').orderBy('count', 'desc');

  if (country) {
    queryRef = queryRef.where('country', '==', country);
  }
  if (language) {
    queryRef = queryRef.where('language', '==', language);
  }

  const snapshot = await queryRef.limit(10).get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      query: data.query,
      count: data.count,
      country: data.country,
      language: data.language,
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
    };
  });
};
