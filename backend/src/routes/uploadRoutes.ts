import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { b2Client } from '../config/b2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { buildB2FileKey } from '../utils/fileKeys';
import { 
  createPendingUpload, 
  markUploadAsCompleted, 
  markUploadAsFailed, 
  getUserUploads, 
  attachUploadToEntity 
} from '../services/uploadService';

export const uploadRoutes = Router();

const PresignBodySchema = z.object({
  fileType: z.enum(['profile_photo', 'room_cover', 'live_thumbnail', 'gift_asset', 'banner', 'video', 'kyc_id_document', 'kyc_selfie']),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'application/json', 'image/gif']),
  originalFileName: z.string().min(1),
  sizeBytes: z.number().optional(),
  relatedType: z.enum(['user', 'room', 'live', 'gift', 'banner', 'video', 'verification']).optional(),
  relatedId: z.string().optional(),
});

const MAX_SIZES: Record<string, number> = {
  profile_photo: 5 * 1024 * 1024,
  room_cover: 8 * 1024 * 1024,
  live_thumbnail: 8 * 1024 * 1024,
  gift_asset: 20 * 1024 * 1024,
  banner: 8 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  kyc_id_document: 10 * 1024 * 1024,
  kyc_selfie: 10 * 1024 * 1024,
};

uploadRoutes.post('/presign', requireAuth, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user.uid;
    const data = PresignBodySchema.parse(req.body);

    const maxSize = MAX_SIZES[data.fileType];
    if (data.sizeBytes && data.sizeBytes > maxSize) {
      return res.status(400).json({ error: `File too large. Max size is ${maxSize} bytes` });
    }

    const fileKey = buildB2FileKey({
      userId,
      fileType: data.fileType,
      contentType: data.contentType,
      originalFileName: data.originalFileName,
    });

    const uploadId = uuidv4();
    const expiresIn = 900; // 15 mins
    const publicUrl = `${process.env.B2_PUBLIC_BASE_URL}/${fileKey}`;

    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: fileKey,
      ContentType: data.contentType,
    });

    const uploadUrl = await getSignedUrl(b2Client, command, { expiresIn });

    await createPendingUpload({
      uploadId,
      userId,
      fileKey,
      publicUrl,
      fileType: data.fileType,
      contentType: data.contentType,
      originalFileName: data.originalFileName,
      sizeBytes: data.sizeBytes,
      relatedType: data.relatedType,
      relatedId: data.relatedId,
    });

    res.json({
      uploadId,
      uploadUrl,
      fileKey,
      publicUrl,
      expiresIn,
      contentType: data.contentType,
    });
  } catch (error) {
    console.error('Presign error:', error);
    res.status(400).json({ error: 'Failed to generate presigned URL' });
  }
});

uploadRoutes.post('/:uploadId/confirm', requireAuth, async (req: AuthRequest, res: any) => {
  try {
    const uploadId = req.params.uploadId as string;
    const userId = req.user.uid;

    const uploadData = await markUploadAsCompleted(uploadId, userId);
    if (uploadData) {
      await attachUploadToEntity({ ...uploadData, userId });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

uploadRoutes.post('/:uploadId/fail', requireAuth, async (req: AuthRequest, res: any) => {
  try {
    const uploadId = req.params.uploadId as string;
    const userId = req.user.uid;
    const { reason } = req.body;

    await markUploadAsFailed(uploadId, userId, reason);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

uploadRoutes.get('/my', requireAuth, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user.uid;
    const uploads = await getUserUploads(userId);
    res.json(uploads);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
