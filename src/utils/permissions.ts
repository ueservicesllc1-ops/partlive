import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

export type PermissionType = 'microphone' | 'camera';
export type AppPermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

/**
 * Gets the native permission string based on the platform and requested type.
 */
const getNativePermission = (type: PermissionType) => {
  if (Platform.OS === 'ios') {
    return type === 'camera' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.IOS.MICROPHONE;
  } else {
    return type === 'camera' ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.ANDROID.RECORD_AUDIO;
  }
};

/**
 * Checks the current device permission status without requesting it.
 */
export const checkDevicePermission = async (type: PermissionType): Promise<AppPermissionStatus> => {
  try {
    const nativePerm = getNativePermission(type);
    const status = await check(nativePerm);
    
    switch (status) {
      case RESULTS.GRANTED:
      case RESULTS.LIMITED:
        return 'granted';
      case RESULTS.DENIED:
        return 'denied';
      case RESULTS.BLOCKED:
        return 'blocked';
      default:
        return 'unavailable';
    }
  } catch (error) {
    console.error(`[Permissions] Error checking ${type} permission:`, error);
    return 'unavailable';
  }
};

/**
 * Requests the specified device permission.
 */
export const requestDevicePermission = async (type: PermissionType): Promise<AppPermissionStatus> => {
  try {
    const nativePerm = getNativePermission(type);
    const status = await request(nativePerm);
    
    switch (status) {
      case RESULTS.GRANTED:
      case RESULTS.LIMITED:
        return 'granted';
      case RESULTS.DENIED:
        return 'denied';
      case RESULTS.BLOCKED:
        return 'blocked';
      default:
        return 'unavailable';
    }
  } catch (error) {
    console.error(`[Permissions] Error requesting ${type} permission:`, error);
    return 'unavailable';
  }
};

/**
 * Displays an alert instructing the user to enable permissions in device settings.
 */
export const showPermissionBlockedAlert = (
  message: string = 'Para usar esta función necesitamos permiso de micrófono y cámara. Actívalos para poder hablar o transmitir en vivo.'
) => {
  Alert.alert(
    'Permisos Requeridos',
    message,
    [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Configuración',
        onPress: () => {
          openSettings().catch(() => {
            Linking.openSettings();
          });
        },
      },
    ]
  );
};

// ==========================================
// Backward Compatibility / Legacy Fallbacks
// ==========================================

export const requestMicrophonePermission = async (): Promise<boolean> => {
  const status = await requestDevicePermission('microphone');
  return status === 'granted';
};

export const requestCameraPermission = async (): Promise<boolean> => {
  const status = await requestDevicePermission('camera');
  return status === 'granted';
};

export const requestCameraAndMicrophonePermissions = async (): Promise<boolean> => {
  const micGranted = await requestMicrophonePermission();
  const camGranted = await requestCameraPermission();
  return micGranted && camGranted;
};
