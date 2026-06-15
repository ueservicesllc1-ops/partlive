import { v4 as uuidv4 } from 'uuid';

export const sanitizeFileName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
};

export const getExtensionFromContentType = (contentType: string): string => {
  const parts = contentType.split('/');
  if (parts.length === 2) {
    let ext = parts[1].toLowerCase();
    if (ext === 'jpeg') return 'jpg';
    if (ext === 'quicktime') return 'mov';
    return ext;
  }
  return 'bin';
};

interface BuildKeyParams {
  userId: string;
  fileType: string;
  contentType: string;
  originalFileName: string;
}

export const buildB2FileKey = ({ userId, fileType, contentType, originalFileName }: BuildKeyParams): string => {
  const uuid = uuidv4();
  const ext = getExtensionFromContentType(contentType);
  
  switch (fileType) {
    case 'profile_photo':
      return `users/${userId}/profile/${uuid}.${ext}`;
    case 'room_cover':
      return `rooms/${userId}/covers/${uuid}.${ext}`;
    case 'live_thumbnail':
      return `lives/${userId}/thumbnails/${uuid}.${ext}`;
    case 'gift_asset':
      return `gifts/assets/${uuid}.${ext}`;
    case 'banner':
      return `banners/${uuid}.${ext}`;
    case 'video':
      return `videos/${userId}/${uuid}.${ext}`;
    case 'kyc_id_document':
      return `verification/${userId}/${uuid}/id_document.${ext}`;
    case 'kyc_selfie':
      return `verification/${userId}/${uuid}/selfie.${ext}`;
    default:
      return `misc/${userId}/${uuid}.${ext}`;
  }
};
