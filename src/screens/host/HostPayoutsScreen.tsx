import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { usePayouts } from '../../hooks/usePayouts';
import { PayoutList } from '../../components/payouts';
import { HostPayout } from '../../types/payout';

export const HostPayoutsScreen = ({ navigation }: any) => {
  const { payouts, loading } = usePayouts();

  const handleSelectPayout = (payout: HostPayout) => {
    navigation.navigate('PayoutDetails', { payoutId: payout.id, initialPayout: payout });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Retiros</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('PayoutMethods')}
          >
            <Text style={styles.actionEmoji}>🏦</Text>
            <Text style={styles.actionLabel}>Métodos de Pago</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.actionPrimaryCard]}
            onPress={() => navigation.navigate('RequestPayout')}
          >
            <Text style={styles.actionEmoji}>💸</Text>
            <Text style={[styles.actionLabel, styles.actionPrimaryLabel]}>Solicitar Retiro</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Tus Solicitudes</Text>
        <View style={styles.listContainer}>
          <PayoutList
            payouts={payouts}
            onSelectPayout={handleSelectPayout}
            loading={loading}
          />
        </View>
      </View>
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
  content: { flex: 1, padding: spacing.lg },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  actionPrimaryCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '1A',
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  actionPrimaryLabel: {
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  listContainer: {
    flex: 1,
  },
});
