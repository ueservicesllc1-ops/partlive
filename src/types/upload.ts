export interface UploadFileRecord {
  id: string;
  userId: string;
  fileKey: string;
  publicUrl?: string;
  fileType: 'profile_photo' | 'room_cover' | 'live_thumbnail' | 'gift_asset' | 'banner' | 'video';
  contentType: string;
  originalFileName: string;
  sizeBytes?: number;
  status: 'pending' | 'uploaded' | 'failed' | 'deleted';
  relatedType?: 'user' | 'room' | 'live' | 'gift' | 'banner' | 'video';
  relatedId?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  uploadedAt?: any; // Firestore Timestamp
}
