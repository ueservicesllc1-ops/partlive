import { requestPresignedUpload, uploadFileToPresignedUrl, confirmUpload, failUpload } from '../api/uploadApi';

interface UploadResult {
  uploadId: string;
  fileKey: string;
  publicUrl: string;
  status: 'success' | 'failed';
}

const performUploadFlow = async (
  localUri: string,
  contentType: string,
  originalFileName: string,
  fileType: string,
  relatedType?: string,
  relatedId?: string
): Promise<UploadResult> => {
  let uploadId = '';
  try {
    const presignData = await requestPresignedUpload({
      fileType,
      contentType,
      originalFileName,
      relatedType,
      relatedId,
    });
    uploadId = presignData.uploadId;

    await uploadFileToPresignedUrl(presignData.uploadUrl, localUri, contentType);
    await confirmUpload(uploadId);

    return {
      uploadId,
      fileKey: presignData.fileKey,
      publicUrl: presignData.publicUrl,
      status: 'success',
    };
  } catch (error: any) {
    console.error(`Upload flow failed for ${fileType}:`, error);
    if (uploadId) {
      await failUpload(uploadId, error.message).catch(e => console.error('Failed to notify fail status:', e));
    }
    throw error;
  }
};

export const uploadProfilePhoto = (localUri: string, contentType: string, originalFileName: string) => {
  return performUploadFlow(localUri, contentType, originalFileName, 'profile_photo', 'user');
};

export const uploadRoomCover = (localUri: string, contentType: string, originalFileName: string, roomId: string) => {
  return performUploadFlow(localUri, contentType, originalFileName, 'room_cover', 'room', roomId);
};

export const uploadLiveThumbnail = (localUri: string, contentType: string, originalFileName: string, liveId: string) => {
  return performUploadFlow(localUri, contentType, originalFileName, 'live_thumbnail', 'live', liveId);
};

export const uploadVideo = (localUri: string, contentType: string, originalFileName: string) => {
  return performUploadFlow(localUri, contentType, originalFileName, 'video', 'video');
};
