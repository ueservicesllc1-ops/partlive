import { db } from '../config/firebase';

const UPLOADS_COLLECTION = 'uploads';

interface CreatePendingUploadData {
  uploadId: string;
  userId: string;
  fileKey: string;
  publicUrl?: string;
  fileType: string;
  contentType: string;
  originalFileName: string;
  sizeBytes?: number;
  relatedType?: string;
  relatedId?: string;
}

export const createPendingUpload = async (data: CreatePendingUploadData) => {
  const docRef = db.collection(UPLOADS_COLLECTION).doc(data.uploadId);
  const now = new Date();
  await docRef.set({
    id: data.uploadId,
    userId: data.userId,
    fileKey: data.fileKey,
    publicUrl: data.publicUrl || null,
    fileType: data.fileType,
    contentType: data.contentType,
    originalFileName: data.originalFileName,
    sizeBytes: data.sizeBytes || null,
    status: 'pending',
    relatedType: data.relatedType || null,
    relatedId: data.relatedId || null,
    createdAt: now,
    updatedAt: now,
  });
  return data.uploadId;
};

export const markUploadAsCompleted = async (uploadId: string, userId: string) => {
  const docRef = db.collection(UPLOADS_COLLECTION).doc(uploadId);
  const doc = await docRef.get();
  
  if (!doc.exists) throw new Error('Upload not found');
  const data = doc.data();
  if (data?.userId !== userId) throw new Error('Unauthorized');
  if (data?.status === 'deleted') throw new Error('Upload is deleted');

  const now = new Date();
  await docRef.update({
    status: 'uploaded',
    uploadedAt: now,
    updatedAt: now,
  });
  
  return doc.data();
};

export const markUploadAsFailed = async (uploadId: string, userId: string, reason?: string) => {
  const docRef = db.collection(UPLOADS_COLLECTION).doc(uploadId);
  const doc = await docRef.get();
  
  if (!doc.exists) throw new Error('Upload not found');
  if (doc.data()?.userId !== userId) throw new Error('Unauthorized');

  await docRef.update({
    status: 'failed',
    failReason: reason || null,
    updatedAt: new Date(),
  });
};

export const getUserUploads = async (userId: string) => {
  const snapshot = await db.collection(UPLOADS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
    
  return snapshot.docs.map(doc => doc.data());
};

export const attachUploadToEntity = async (uploadData: any) => {
  const { fileType, relatedType, relatedId, publicUrl, userId } = uploadData;
  if (!publicUrl) return;

  try {
    const now = new Date();
    if (fileType === 'profile_photo') {
      await db.collection('users').doc(userId).update({
        photoURL: publicUrl,
        updatedAt: now
      });
    } else if (fileType === 'room_cover' && relatedType === 'room' && relatedId) {
      await db.collection('rooms').doc(relatedId).update({
        coverImageUrl: publicUrl,
        updatedAt: now
      });
    } else if (fileType === 'live_thumbnail' && relatedType === 'live' && relatedId) {
      await db.collection('lives').doc(relatedId).update({
        thumbnailUrl: publicUrl,
        updatedAt: now
      });
    }
  } catch (error) {
    console.error('Failed to attach upload to entity:', error);
  }
};
