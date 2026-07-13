import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../store/AuthContext';
import { createLive } from '../../services/firebase/firestore/livesService';
import { StartLiveForm } from '../../components/lives/StartLiveForm';
import { colors, spacing, textPresets } from '../../theme';
import { MAIN_ROUTES } from '../../app/routes';
import {
  checkDevicePermission,
  requestDevicePermission,
  showPermissionBlockedAlert,
} from '../../utils/permissions';

export const StartLiveScreen = ({ navigation }: any) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleStartLive = async (formData: any) => {
    if (!userProfile) {
      Alert.alert('Autenticación Requerida', 'Debes iniciar sesión para comenzar una transmisión.');
      return;
    }

    setLoading(true);
    try {
      // 1. Check current permissions
      let cameraStatus = await checkDevicePermission('camera');
      let microphoneStatus = await checkDevicePermission('microphone');

      // 2. If blocked, show settings redirect alert and stop
      if (cameraStatus === 'blocked' || microphoneStatus === 'blocked') {
        showPermissionBlockedAlert(
          'Para usar esta función necesitamos permiso de micrófono y cámara. Actívalos para poder hablar o transmitir en vivo.'
        );
        setLoading(false);
        return;
      }

      // 3. Request permissions if not granted
      if (cameraStatus !== 'granted') {
        cameraStatus = await requestDevicePermission('camera');
      }
      if (microphoneStatus !== 'granted') {
        microphoneStatus = await requestDevicePermission('microphone');
      }

      // 4. Handle final state after requests
      if (cameraStatus !== 'granted') {
        Alert.alert(
          'Permiso de Cámara Requerido',
          'No puedes iniciar transmisión de video sin otorgar el permiso de cámara.'
        );
        setLoading(false);
        return;
      }

      if (microphoneStatus !== 'granted') {
        // If mic is denied, ask the user if they want to start the live stream without audio
        const startWithoutAudio = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Transmisión sin Audio',
            'No has otorgado el permiso de micrófono. La transmisión no tendrá audio. ¿Deseas iniciar de todas formas?',
            [
              { text: 'Cancelar', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Iniciar sin audio', onPress: () => resolve(true) }
            ],
            { cancelable: false }
          );
        });

        if (!startWithoutAudio) {
          setLoading(false);
          return;
        }
      }

      const liveId = await createLive(userProfile, formData);
      navigation.replace(MAIN_ROUTES.LIVE_DETAILS, { liveId });
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message || 'Error al iniciar la transmisión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Configurar Live Stream</Text>
        <View style={styles.placeholder} />
      </View>

      <StartLiveForm onSubmit={handleStartLive} loading={loading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#292440',
  },
  backBtn: {
    paddingVertical: 4,
  },
  backText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
  },
  placeholder: {
    width: 60,
  },
});
export default StartLiveScreen;
