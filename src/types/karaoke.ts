export type KaraokeSongStatus =
  | 'active'
  | 'inactive'
  | 'pending_review'
  | 'rejected';

export type KaraokeQueueStatus =
  | 'pending'
  | 'approved'
  | 'singing'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'skipped';

export type KaraokeSessionStatus = 'active' | 'paused' | 'ended';

export type KaraokeBattleStatus =
  | 'scheduled'
  | 'active'
  | 'voting'
  | 'ended'
  | 'cancelled';

export interface KaraokeSong {
  id: string;
  title: string;
  titleLowercase?: string;
  artist?: string;
  artistLowercase?: string;
  language?: string;
  genre?: string;
  durationSeconds?: number;
  coverUrl?: string;
  audioUrl?: string;
  instrumentalUrl?: string;
  lyricsText?: string;
  lyricsLrcUrl?: string;
  sourceType: 'admin_upload' | 'host_upload' | 'public_domain' | 'licensed' | 'external_link';
  sourceUrl?: string;
  uploadedBy?: string;
  status: KaraokeSongStatus;
  isFeatured: boolean;
  playCount: number;
  searchKeywords?: string[];
  tags?: string[];
  createdAt: any;
  updatedAt: any;
}

export interface KaraokeQueueItem {
  id: string;
  roomId?: string;
  liveId?: string;
  sessionId: string;
  songId: string;
  songTitle: string;
  singerId: string;
  singerName: string;
  singerPhotoURL?: string;
  status: KaraokeQueueStatus;
  position: number;
  requestedAt: any;
  approvedAt?: any;
  startedAt?: any;
  completedAt?: any;
  rejectedReason?: string;
}

export interface KaraokeSession {
  id: string;
  roomId?: string;
  liveId?: string;
  hostId: string;
  status: KaraokeSessionStatus;
  currentQueueItemId?: string;
  currentSongId?: string;
  currentSingerId?: string;
  startedAt: any;
  endedAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface KaraokePerformance {
  id: string;
  sessionId: string;
  roomId?: string;
  liveId?: string;
  songId: string;
  singerId: string;
  singerName: string;
  durationSeconds?: number;
  giftsReceivedDiamonds: number;
  beansGenerated: number;
  score?: number;
  votesCount?: number;
  completedAt: any;
  createdAt: any;
}

export interface KaraokeFavorite {
  id: string; // userId_songId
  userId: string;
  songId: string;
  createdAt: any;
}

export interface KaraokeBattle {
  id: string;
  title: string;
  description?: string;
  roomId?: string;
  liveId?: string;
  eventId?: string;
  status: KaraokeBattleStatus;
  participantIds: string[];
  votingEnabled: boolean;
  startsAt: any;
  endsAt?: any;
  winnerId?: string;
  createdAt: any;
  updatedAt: any;
}
