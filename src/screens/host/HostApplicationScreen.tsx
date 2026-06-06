import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { MAIN_ROUTES } from '../../app/routes';
import { useHostDashboard } from '../../hooks/useHostDashboard';
import { useAuth } from '../../store/AuthContext';
import { HostApplicationForm } from '../../components/host';

export const HostApplicationScreen = ({ navigation }: any) => {
  const { userProfile } = useAuth();
  const { applyToBecomeHost } = useHostDashboard();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      await applyToBecomeHost({
        ...formData,
        displayName: userProfile?.displayName || '',
        username: userProfile?.username || '',
        email: userProfile?.email || '',
      });
      Alert.alert(
        '¡Solicitud Enviada! ⏳',
        'Tu solicitud fue recibida. La revisaremos en los próximos días y te notificaremos por aquí.',
        [{ text: 'Entendido', onPress: () => navigation.navigate(MAIN_ROUTES.HOST_DASHBOARD) }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo enviar. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitar ser Host</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>🎙️</Text>
          <Text style={styles.infoTitle}>Programa de Hosts</Text>
          <Text style={styles.infoText}>
            Completa este formulario para unirte al programa. No solicites información de pago ni documentos de identidad todavía.
          </Text>
        </View>

        <HostApplicationForm onSubmit={handleSubmit} isLoading={isLoading} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  backArrow: { fontSize: 24, color: colors.text },
  headerTitle: { ...textPresets.h2, color: colors.text, flex: 1, textAlign: 'center' },
  headerRight: { width: 40 },
  scrollContent: { paddingBottom: spacing.xxl },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    margin: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  infoEmoji: { fontSize: 40, marginBottom: spacing.sm },
  infoTitle: { ...textPresets.h3, color: colors.text, marginBottom: spacing.xs },
  infoText: { ...textPresets.bodySmall, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});

export default HostApplicationScreen;
