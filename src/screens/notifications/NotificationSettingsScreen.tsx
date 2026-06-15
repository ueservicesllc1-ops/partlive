import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationSettingsForm } from '../../components/notifications/NotificationSettingsForm';

export const NotificationSettingsScreen = ({ navigation }: any) => {
  const { settings, updateSettings, loading } = useNotifications();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferencias de Notificaciones</Text>
        <View style={styles.headerRight} />
      </View>

      {loading || !settings ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionHeader}>Tipos de Notificación</Text>
          <NotificationSettingsForm settings={settings} onUpdate={updateSettings} />
        </ScrollView>
      )}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1B30',
  },
  backBtn: {
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    ...textPresets.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
});
