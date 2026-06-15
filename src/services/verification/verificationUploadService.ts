import { launchImageLibrary } from 'react-native-image-picker';
import { apiFetch } from '../api/apiClient';

export interface PickedImageResult {
  uri: string;
  fileName: string;
  fileSize: number;
  type: string;
}

export const selectVerificationImage = async (): Promise<PickedImageResult> => {
  return new Promise((resolve, reject) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) {
          reject(new Error('Selección cancelada por el usuario.'));
        } else if (response.errorCode) {
          reject(new Error(response.errorMessage || 'Error al seleccionar la imagen.'));
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          const fileSize = asset.fileSize || 0;
          
          // Max size 10MB
          if (fileSize > 10 * 1024 * 1024) {
            reject(new Error('La imagen es demasiado grande. El límite es de 10 MB.'));
            return;
          }

          resolve({
            uri: asset.uri || '',
            fileName: asset.fileName || 'upload.jpg',
            fileSize,
            type: asset.type || 'image/jpeg',
          });
        } else {
          reject(new Error('No se pudo obtener el archivo de imagen.'));
        }
      }
    );
  });
};

export const uploadVerificationFile = async (
  uri: string,
  fileType: 'kyc_id_document' | 'kyc_selfie',
  fileName: string,
  contentType: string
): Promise<string> => {
  // 1. Get presigned upload URL from backend
  const presignData = await apiFetch('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({
      fileType,
      contentType,
      originalFileName: fileName,
      relatedType: 'verification',
    }),
  });

  const { uploadId, uploadUrl, publicUrl } = presignData;

  // 2. Upload file binary data using PUT request
  const fileBlob = await (await fetch(uri)).blob();
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: fileBlob,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (!uploadResponse.ok) {
    // Notify failure
    await apiFetch(`/uploads/${uploadId}/fail`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'S3 PUT upload failed' }),
    }).catch(() => {});
    
    throw new Error('La carga del documento en el bucket falló.');
  }

  // 3. Confirm upload on backend
  await apiFetch(`/uploads/${uploadId}/confirm`, {
    method: 'POST',
  });

  return publicUrl;
};
