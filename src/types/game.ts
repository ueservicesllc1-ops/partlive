export interface Game {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
