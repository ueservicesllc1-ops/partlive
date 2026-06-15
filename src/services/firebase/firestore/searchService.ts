import firestore from '@react-native-firebase/firestore';
import { SearchFilter, SearchResult, RecentSearch, TrendingSearch } from '../../../types/search';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { normalizeSearchText, startsWithSearchRange } from '../../../utils/searchNormalize';

// Helper to map entities to SearchResult
const mapUserToResult = (doc: any): SearchResult => {
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
    category: undefined,
    score: data.followersCount || 0,
    metadata: {
      isHost: !!data.isHost,
      isVip: !!data.isVip,
      followersCount: data.followersCount || 0,
      level: data.level || 1,
    },
  };
};

const mapRoomToResult = (doc: any): SearchResult => {
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
      isLive: !!data.isLive,
    },
  };
};

const mapLiveToResult = (doc: any): SearchResult => {
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
      giftsCount: data.giftsCount || 0,
      status: data.status,
    },
  };
};

const mapGameToResult = (doc: any): SearchResult => {
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
      isActive: !!data.isActive,
    },
  };
};

const mapEventToResult = (doc: any): SearchResult => {
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
      status: data.status,
    },
  };
};

const mapAgencyToResult = (doc: any): SearchResult => {
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
      totalBeansGenerated: data.totalBeansGenerated || 0,
    },
  };
};

// Search users / hosts
export const searchUsers = async (filters: SearchFilter): Promise<SearchResult[]> => {
  const limitCount = 20;
  let queryRef = firestore().collection(FirestoreCollections.USERS);

  // Security: Only active and not banned users
  queryRef = queryRef.where('status', '==', 'active') as any;

  if (filters.isHost !== undefined) {
    queryRef = queryRef.where('isHost', '==', filters.isHost) as any;
  }
  if (filters.isVip !== undefined) {
    queryRef = queryRef.where('isVip', '==', filters.isVip) as any;
  }
  if (filters.country) {
    queryRef = queryRef.where('country', '==', filters.country) as any;
  }
  if (filters.language) {
    queryRef = queryRef.where('language', '==', filters.language) as any;
  }

  // Handle prefix search on usernameLowercase
  if (filters.query) {
    const cleanQuery = normalizeSearchText(filters.query);
    if (cleanQuery) {
      const range = startsWithSearchRange(cleanQuery);
      queryRef = queryRef
        .where('usernameLowercase', '>=', range.start)
        .where('usernameLowercase', '<=', range.end) as any;
    }
  }

  const snapshot = await queryRef.limit(limitCount).get();
  return snapshot.docs.map(mapUserToResult);
};

// Search voice rooms
export const searchRooms = async (filters: SearchFilter): Promise<SearchResult[]> => {
  const limitCount = 20;
  let queryRef = firestore().collection(FirestoreCollections.ROOMS);

  // Security: exclude suspended rooms
  queryRef = queryRef.where('status', '==', 'active') as any;

  if (filters.isLive !== undefined) {
    queryRef = queryRef.where('isLive', '==', filters.isLive) as any;
  }
  if (filters.country) {
    queryRef = queryRef.where('country', '==', filters.country) as any;
  }
  if (filters.language) {
    queryRef = queryRef.where('language', '==', filters.language) as any;
  }
  if (filters.category) {
    queryRef = queryRef.where('category', '==', filters.category) as any;
  }

  if (filters.query) {
    const cleanQuery = normalizeSearchText(filters.query);
    if (cleanQuery) {
      const range = startsWithSearchRange(cleanQuery);
      queryRef = queryRef
        .where('titleLowercase', '>=', range.start)
        .where('titleLowercase', '<=', range.end) as any;
    }
  }

  const snapshot = await queryRef.limit(limitCount).get();
  return snapshot.docs.map(mapRoomToResult);
};

// Search Lives
export const searchLives = async (filters: SearchFilter): Promise<SearchResult[]> => {
  const limitCount = 20;
  let queryRef = firestore().collection(FirestoreCollections.LIVES);

  // Security: only active live shows
  queryRef = queryRef.where('status', '==', 'live') as any;

  if (filters.country) {
    queryRef = queryRef.where('country', '==', filters.country) as any;
  }
  if (filters.language) {
    queryRef = queryRef.where('language', '==', filters.language) as any;
  }
  if (filters.category) {
    queryRef = queryRef.where('category', '==', filters.category) as any;
  }

  if (filters.query) {
    const cleanQuery = normalizeSearchText(filters.query);
    if (cleanQuery) {
      const range = startsWithSearchRange(cleanQuery);
      queryRef = queryRef
        .where('titleLowercase', '>=', range.start)
        .where('titleLowercase', '<=', range.end) as any;
    }
  }

  const snapshot = await queryRef.limit(limitCount).get();
  return snapshot.docs.map(mapLiveToResult);
};

// Search Games
export const searchGames = async (filters: SearchFilter): Promise<SearchResult[]> => {
  const limitCount = 20;
  let queryRef = firestore().collection(FirestoreCollections.GAMES);

  // Filters
  queryRef = queryRef.where('isActive', '==', true) as any;

  if (filters.category) {
    queryRef = queryRef.where('category', '==', filters.category) as any;
  }

  if (filters.query) {
    const cleanQuery = normalizeSearchText(filters.query);
    if (cleanQuery) {
      const range = startsWithSearchRange(cleanQuery);
      queryRef = queryRef
        .where('titleLowercase', '>=', range.start)
        .where('titleLowercase', '<=', range.end) as any;
    }
  }

  const snapshot = await queryRef.limit(limitCount).get();
  return snapshot.docs.map(mapGameToResult);
};

// Search Special Events
export const searchEvents = async (filters: SearchFilter): Promise<SearchResult[]> => {
  const limitCount = 20;
  let queryRef = firestore().collection(FirestoreCollections.EVENTS);

  // Exclude inactive / cancelled
  queryRef = queryRef.where('status', '==', 'active') as any;

  if (filters.country) {
    queryRef = queryRef.where('country', '==', filters.country) as any;
  }
  if (filters.language) {
    queryRef = queryRef.where('language', '==', filters.language) as any;
  }

  if (filters.query) {
    const cleanQuery = normalizeSearchText(filters.query);
    if (cleanQuery) {
      const range = startsWithSearchRange(cleanQuery);
      queryRef = queryRef
        .where('titleLowercase', '>=', range.start)
        .where('titleLowercase', '<=', range.end) as any;
    }
  }

  const snapshot = await queryRef.limit(limitCount).get();
  return snapshot.docs.map(mapEventToResult);
};

// Search Agencies
export const searchAgencies = async (filters: SearchFilter): Promise<SearchResult[]> => {
  const limitCount = 20;
  let queryRef = firestore().collection(FirestoreCollections.AGENCIES);

  // Filters
  queryRef = queryRef.where('status', '==', 'active') as any;

  if (filters.country) {
    queryRef = queryRef.where('country', '==', filters.country) as any;
  }

  if (filters.query) {
    const cleanQuery = normalizeSearchText(filters.query);
    if (cleanQuery) {
      const range = startsWithSearchRange(cleanQuery);
      queryRef = queryRef
        .where('nameLowercase', '>=', range.start)
        .where('nameLowercase', '<=', range.end) as any;
    }
  }

  const snapshot = await queryRef.limit(limitCount).get();
  return snapshot.docs.map(mapAgencyToResult);
};

// Main search aggregator
export const searchAll = async (filters: SearchFilter): Promise<SearchResult[]> => {
  const results: SearchResult[] = [];
  const promises: Promise<SearchResult[]>[] = [];

  const types = filters.entityTypes.length > 0 ? filters.entityTypes : ['user', 'room', 'live', 'game', 'event', 'agency'];

  if (types.includes('user') || types.includes('host')) {
    // If hosts is included specifically, run with isHost filter or search all users
    const userPromise = searchUsers({
      ...filters,
      isHost: types.includes('host') && !types.includes('user') ? true : undefined,
    });
    promises.push(userPromise);
  }

  if (types.includes('room')) {
    promises.push(searchRooms(filters));
  }

  if (types.includes('live')) {
    promises.push(searchLives(filters));
  }

  if (types.includes('game')) {
    promises.push(searchGames(filters));
  }

  if (types.includes('event')) {
    promises.push(searchEvents(filters));
  }

  if (types.includes('agency')) {
    promises.push(searchAgencies(filters));
  }

  const subResults = await Promise.all(promises);
  subResults.forEach(list => results.push(...list));

  // Sort logic client-side
  return results.sort((a, b) => {
    switch (filters.sortBy) {
      case 'popular': {
        const valA = a.score || 0;
        const valB = b.score || 0;
        return valB - valA;
      }
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
        // Relevance based on query match startsWith length, user levels etc.
        return (b.score || 0) - (a.score || 0);
    }
  });
};

// Save recent searches
export const saveRecentSearch = async (
  userId: string,
  query: string,
  filters?: Partial<SearchFilter>,
): Promise<void> => {
  const cleanQuery = query.trim();
  if (!cleanQuery || !userId) return;

  const collectionRef = firestore().collection('recentSearches');

  // Check if same query already exists for user to update timestamp
  const querySnapshot = await collectionRef
    .where('userId', '==', userId)
    .where('query', '==', cleanQuery)
    .limit(1)
    .get();

  if (!querySnapshot.empty) {
    const docId = querySnapshot.docs[0].id;
    await collectionRef.doc(docId).update({
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await collectionRef.add({
      userId,
      query: cleanQuery,
      filters: filters || {},
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  // Update trending count
  const trendingRef = firestore().collection('trendingSearches');
  const trendingSnapshot = await trendingRef
    .where('query', '==', cleanQuery)
    .limit(1)
    .get();

  if (!trendingSnapshot.empty) {
    const docId = trendingSnapshot.docs[0].id;
    await trendingRef.doc(docId).update({
      count: firestore.FieldValue.increment(1),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await trendingRef.add({
      query: cleanQuery,
      count: 1,
      country: filters?.country || null,
      language: filters?.language || null,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  }
};

// Get recent searches
export const getRecentSearches = async (userId: string): Promise<RecentSearch[]> => {
  if (!userId) return [];
  const snapshot = await firestore()
    .collection('recentSearches')
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
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
    };
  });
};

// Clear recent searches
export const clearRecentSearches = async (userId: string): Promise<void> => {
  if (!userId) return;
  const snapshot = await firestore()
    .collection('recentSearches')
    .where('userId', '==', userId)
    .get();

  const batch = firestore().batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};

// Get trending searches
export const getTrendingSearches = async (
  country?: string,
  language?: string,
): Promise<TrendingSearch[]> => {
  let queryRef = firestore().collection('trendingSearches').orderBy('count', 'desc');

  if (country) {
    queryRef = queryRef.where('country', '==', country) as any;
  }
  if (language) {
    queryRef = queryRef.where('language', '==', language) as any;
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
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
    };
  });
};
