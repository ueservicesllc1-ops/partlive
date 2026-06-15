import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';

interface QuickAction {
  id: string;
  label: string;
  emoji: string;
  color: string;
  onPress: () => void;
}

interface Props {
  onStartLive?: () => void;
  onCreateRoom?: () => void;
  onViewEarnings?: () => void;
  onViewActivity?: () => void;
  onViewRules?: () => void;
  onViewPayouts?: () => void;
  onViewPayoutMethods?: () => void;
  onViewAnalytics?: () => void;
}

export const HostQuickActions: React.FC<Props> = ({
  onStartLive,
  onCreateRoom,
  onViewEarnings,
  onViewActivity,
  onViewRules,
  onViewPayouts,
  onViewPayoutMethods,
  onViewAnalytics,
}) => {
  const actions: QuickAction[] = [
    { id: 'live', label: 'Iniciar Live', emoji: '📺', color: colors.secondary, onPress: onStartLive || (() => {}) },
    { id: 'room', label: 'Crear Sala', emoji: '🎙️', color: colors.primary, onPress: onCreateRoom || (() => {}) },
    { id: 'earnings', label: 'Ganancias', emoji: '💎', color: colors.gold, onPress: onViewEarnings || (() => {}) },
    { id: 'payouts', label: 'Retiros', emoji: '💸', color: colors.success, onPress: onViewPayouts || (() => {}) },
    { id: 'methods', label: 'Cuentas', emoji: '🏦', color: colors.accent, onPress: onViewPayoutMethods || (() => {}) },
    { id: 'analytics', label: 'Analíticas', emoji: '📊', color: '#8b5cf6', onPress: onViewAnalytics || (() => {}) },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acciones Rápidas</Text>
      <View style={styles.grid}>
        {actions.map(action => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, { borderColor: action.color + '44' }]}
            onPress={action.onPress}
            activeOpacity={0.75}
            accessibilityLabel={action.label}
          >
            <View style={[styles.iconCircle, { backgroundColor: action.color + '22' }]}>
              <Text style={styles.emoji}>{action.emoji}</Text>
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    width: '18%',
    minWidth: 62,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.xs,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  actionLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
});
