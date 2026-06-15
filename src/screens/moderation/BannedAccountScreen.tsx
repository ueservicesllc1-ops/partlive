import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { colors, spacing, textPresets } from '../../theme';

export const BannedAccountScreen: React.FC = () => {
  const { userProfile, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>❌</Text>
        </View>

        <Text style={styles.title}>Cuenta Suspendida Permanentemente</Text>
        <Text style={styles.subtitle}>
          Tu cuenta ha sido baneada de forma permanente debido a violaciones graves y/o repetidas de nuestras Normas de la Comunidad.
        </Text>

        {userProfile?.bannedReason && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Motivo de la Sanción:</Text>
            <Text style={styles.reasonText}>{userProfile.bannedReason}</Text>
          </View>
        )}

        <Text style={styles.footerText}>
          Esta decisión es definitiva y no puede ser apelada a menos que consideres que hubo un error de identificación grave. En tal caso, contacta a soporte@partylive.app.
        </Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.error + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.error,
  },
  icon: {
    fontSize: 50,
  },
  title: {
    ...textPresets.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xxl,
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
    backgroundColor: colors.error + '11',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error + '33',
    marginTop: spacing.xs,
  },
  footerText: {
    fontSize: 12,
    color: colors.textDark,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  logoutBtn: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 'bold',
  },
});
