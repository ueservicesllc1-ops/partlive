import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { useHostDashboard } from '../../hooks/useHostDashboard';
import { HostRulesList } from '../../components/host/HostRulesList';

export const HostRulesScreen = ({ navigation }: any) => {
  const { rules, loading } = useHostDashboard();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reglas del Programa</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.introCard}>
            <Text style={styles.introEmoji}>📜</Text>
            <Text style={styles.introTitle}>Código de Conducta para Hosts</Text>
            <Text style={styles.introText}>
              Como host de PartyLive, eres responsable del contenido de tus lives y salas.
              El incumplimiento de estas reglas puede resultar en la suspensión de tu cuenta.
            </Text>
          </View>

          <HostRulesList rules={rules} />
        </ScrollView>
      )}
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
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: spacing.xxl },
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    margin: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  introEmoji: { fontSize: 40 },
  introTitle: { ...textPresets.h3, color: colors.text, textAlign: 'center' },
  introText: { ...textPresets.bodySmall, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});

export default HostRulesScreen;
