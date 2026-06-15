import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../../components/Button';

export const VerificationStartScreen = ({ navigation }: any) => {
  const { userProfile } = useAuth();
  const kycStatus = userProfile?.kycStatus || 'not_verified';
  const isVerified = userProfile?.isKycVerified || false;

  const handleBack = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verificación de Cuenta</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🛡️</Text>
          <Text style={styles.heroTitle}>Verificación KYC obligatoria</Text>
          <Text style={styles.heroDesc}>
            Para cumplir con regulaciones locales y habilitar retiros monetarios como host o agencia, debes verificar tu identidad de forma segura.
          </Text>
        </View>

        {/* Current status display */}
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Estado actual:</Text>
          {isVerified ? (
            <View style={[styles.badge, styles.badgeSuccess]}>
              <Text style={styles.badgeSuccessText}>✓ Cuenta Verificada</Text>
            </View>
          ) : kycStatus === 'pending' ? (
            <View style={[styles.badge, styles.badgePending]}>
              <Text style={styles.badgePendingText}>⚡ En revisión</Text>
            </View>
          ) : kycStatus === 'rejected' ? (
            <View style={[styles.badge, styles.badgeError]}>
              <Text style={styles.badgeErrorText}>✕ Rechazada / Intentar de nuevo</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.badgeNone]}>
              <Text style={styles.badgeNoneText}>No Iniciada</Text>
            </View>
          )}
        </View>

        {/* Privacy Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔒 Privacidad de tus datos</Text>
          <Text style={styles.infoText}>
            PartyLiveApp almacena de manera privada en buckets protegidos tus documentos. Solo administradores autorizados tienen acceso a través de links temporales encriptados únicamente para fines de validación.
          </Text>
        </View>

        {(!isVerified && kycStatus !== 'pending') && (
          <View style={styles.cta}>
            <Button
              title="Comenzar Verificación"
              variant="primary"
              onPress={() => navigation.navigate('VerificationForm')}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroDesc: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  statusBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
  },
  badgeSuccessText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgePending: {
    backgroundColor: 'rgba(255, 196, 0, 0.15)',
  },
  badgePendingText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeError: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
  },
  badgeErrorText: {
    color: colors.error,
    fontSize: 11,
    fontWeight: 'bold',
  },
  badgeNone: {
    backgroundColor: colors.surfaceLight,
  },
  badgeNoneText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  cta: {
    marginTop: spacing.md,
  },
});
export default VerificationStartScreen;
