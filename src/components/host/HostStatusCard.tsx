import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { HostStatus } from '../../types';

interface Props {
  hostStatus: HostStatus;
  displayName?: string;
  reviewNote?: string;
}

const STATUS_CONFIG: Record<HostStatus, { label: string; color: string; emoji: string; subtitle: string }> = {
  approved: {
    label: 'Host Activo',
    color: colors.success,
    emoji: '🌟',
    subtitle: 'Tu cuenta está activa y verificada como host.',
  },
  pending: {
    label: 'Revisión Pendiente',
    color: colors.warning,
    emoji: '⏳',
    subtitle: 'Tu solicitud está siendo revisada. Te notificaremos pronto.',
  },
  rejected: {
    label: 'Solicitud Rechazada',
    color: colors.error,
    emoji: '❌',
    subtitle: 'Tu solicitud no fue aprobada en esta ocasión.',
  },
  suspended: {
    label: 'Cuenta Suspendida',
    color: colors.error,
    emoji: '🚫',
    subtitle: 'Tu cuenta de host ha sido suspendida temporalmente.',
  },
  not_applied: {
    label: 'No Aplicado',
    color: colors.textMuted,
    emoji: '🎙️',
    subtitle: 'Aún no has solicitado ser host en PartyLive.',
  },
};

export const HostStatusCard: React.FC<Props> = ({ hostStatus, displayName, reviewNote }) => {
  const config = STATUS_CONFIG[hostStatus];

  return (
    <View style={[styles.card, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{config.emoji}</Text>
        <View style={styles.info}>
          {displayName && <Text style={styles.name}>{displayName}</Text>}
          <View style={[styles.badge, { backgroundColor: config.color + '22' }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.subtitle}>{config.subtitle}</Text>
      {reviewNote && hostStatus === 'rejected' && (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Nota del revisor:</Text>
          <Text style={styles.noteText}>{reviewNote}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...textPresets.h3,
    color: colors.text,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    lineHeight: 18,
  },
  noteBox: {
    backgroundColor: colors.error + '15',
    borderRadius: 8,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 2,
  },
  noteText: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
  },
});
