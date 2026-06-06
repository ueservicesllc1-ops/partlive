import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { createLive } from '../../services/firebase/firestore/livesService';
import { StartLiveForm } from '../../components/lives/StartLiveForm';
import { colors, spacing, textPresets } from '../../theme';
import { MAIN_ROUTES } from '../../app/routes';

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
