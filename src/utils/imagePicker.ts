import { launchImageLibrary, ImageLibraryOptions, Asset } from 'react-native-image-picker';
import { Platform } from 'react-native';

export interface PickedImage {
  uri: string;
  fileName: string;
  type: string;
  fileSize: number;
}

export const pickProfileImage = async (): Promise<PickedImage | null> => {
  const options: ImageLibraryOptions = {
    mediaType: 'photo',
    quality: 0.8,
    selectionLimit: 1,
    includeBase64: false,
  };

  try {
    const response = await launchImageLibrary(options);

    if (response.didCancel) {
      return null;
    }

    if (response.errorCode) {
      throw new Error(response.errorMessage || 'Error al abrir la galería');
    }

    if (response.assets && response.assets.length > 0) {
      const asset: Asset = response.assets[0];
      
      if (!asset.uri) {
        throw new Error('No se pudo obtener la ruta de la imagen');
      }

      // Check file size (limit to 5MB)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (asset.fileSize && asset.fileSize > MAX_SIZE) {
        throw new Error('La imagen es demasiado grande. Máximo 5MB permitidos.');
      }

      // Ensure valid type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      const fileType = asset.type || 'image/jpeg';
      
      if (!validTypes.includes(fileType)) {
        throw new Error('Formato no soportado. Usa JPG, PNG o WEBP.');
      }

      // Fallback filename if null
      const fileName = asset.fileName || `profile_${Date.now()}.jpg`;

      return {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        fileName,
        type: fileType,
        fileSize: asset.fileSize || 0,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};
