export type SearchEntityType = 'user' | 'host' | 'room' | 'live' | 'game' | 'event' | 'agency';

export interface SearchFilter {
  entityTypes: SearchEntityType[];
  query?: string;
  country?: string;
  language?: string;
  category?: string;
  status?: string;
  isLive?: boolean;
  isHost?: boolean;
  isVip?: boolean;
  minViewers?: number;
  minFollowers?: number;
  sortBy: 'relevance' | 'popular' | 'recent' | 'viewers' | 'followers' | 'gifts' | 'rank';
}

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  username?: string;
  country?: string;
  language?: string;
  category?: string;
  score?: number;
  metadata?: Record<string, any>;
}

export interface RecentSearch {
  id: string;
  userId: string;
  query: string;
  filters?: Partial<SearchFilter>;
  createdAt: any; // Firebase server timestamp / Date
}

export interface TrendingSearch {
  id: string;
  query: string;
  count: number;
  country?: string;
  language?: string;
  updatedAt: any;
}
