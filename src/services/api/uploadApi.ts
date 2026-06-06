import { apiFetch } from './apiClient';

interface PresignParams {
  fileType: string;
  contentType: string;
  originalFileName: string;
  sizeBytes?: number;
  relatedType?: string;
  relatedId?: string;
}

interface PresignResponse {
  uploadId: string;
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  expiresIn: number;
  contentType: string;
}

export const requestPresignedUpload = async (params: PresignParams): Promise<PresignResponse> => {
  return await apiFetch('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify(params),
  }) as PresignResponse;
};

export const confirmUpload = async (uploadId: string): Promise<void> => {
  await apiFetch(`/uploads/${uploadId}/confirm`, {
    method: 'POST',
  });
};

export const failUpload = async (uploadId: string, reason: string): Promise<void> => {
  await apiFetch(`/uploads/${uploadId}/fail`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
};

export const uploadFileToPresignedUrl = async (uploadUrl: string, fileUri: string, contentType: string): Promise<void> => {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload to B2: ${uploadResponse.status}`);
  }
};
