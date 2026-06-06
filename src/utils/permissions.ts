import { PermissionsAndroid, Platform } from 'react-native';

export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );

    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Permiso de Micrófono',
        message: 'PartyLiveApp necesita acceder a tu micrófono para que puedas hablar en las salas de voz en tiempo real.',
        buttonNeutral: 'Preguntar luego',
        buttonNegative: 'Cancelar',
        buttonPositive: 'Aceptar',
      }
    );

    return status === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting mic permission:', error);
    return false;
  }
};

export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );

    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Permiso de Cámara',
        message: 'PartyLiveApp necesita acceder a tu cámara para transmitir tu video en vivo.',
        buttonNeutral: 'Preguntar luego',
        buttonNegative: 'Cancelar',
        buttonPositive: 'Aceptar',
      }
    );

    return status === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

export const requestCameraAndMicrophonePermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const micGranted = await requestMicrophonePermission();
    const camGranted = await requestCameraPermission();
    return micGranted && camGranted;
  } catch (error) {
    console.error('Error requesting camera and mic permissions:', error);
    return false;
  }
};

