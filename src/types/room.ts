export interface Room {
  id: string;
  title: string;
  description?: string;
  category: string;
  ownerId: string;
  ownerName?: string;
  ownerPhotoURL?: string;
  hostIds: string[];
  moderatorIds: string[];
  speakersCount: number;
  listenersCount: number;
  maxUsers: number;
  maxSpeakers: number;
  isLive: boolean;
  isPrivate: boolean;
  passwordRequired?: boolean;
  password?: string;
  coverImageUrl?: string;
  country?: string;
  language?: string;
  tags?: string[];
  status: 'active' | 'ended' | 'suspended';
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  endedAt?: any; // Firestore Timestamp
}
