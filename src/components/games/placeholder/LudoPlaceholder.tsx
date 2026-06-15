import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../../theme';

interface LudoPlaceholderProps {
  onBack: () => void;
}

export const LudoPlaceholder: React.FC<LudoPlaceholderProps> = ({ onBack }) => (
  <View style={styles.container}>
    <Text style={styles.emoji}>🎲</Text>
    <Text style={styles.title}>Ludo Party</Text>
    <Text style={styles.subtitle}>Próximamente</Text>
    <Text style={styles.desc}>
      El clásico Ludo en tiempo real con voz y regalos virtuales.{'\n'}
      Actualmente en desarrollo.
    </Text>
    <View style={styles.features}>
      {[
        '🎯 Tablero completo 4 jugadores',
        '🗣️ Chat de voz integrado',
        '🎁 Regalos entre jugadores',
        '🏆 Ranking semanal',
      ].map((f, i) => (
        <View key={i} style={styles.featureRow}>
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}
    </View>
    <TouchableOpacity style={styles.backBtn} onPress={onBack}>
      <Text style={styles.backBtnText}>Volver al catálogo</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emoji: { fontSize: 64 },
  title: { ...textPresets.h1, color: colors.text },
  subtitle: {
    ...textPresets.caption,
    color: colors.textMuted,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontWeight: '700',
    letterSpacing: 1,
  },
  desc: {
    ...textPresets.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginVertical: spacing.sm,
  },
  features: { width: '100%', gap: spacing.sm, marginTop: spacing.md },
  featureRow: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureText: { ...textPresets.bodyMedium, color: colors.text },
  backBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.lg,
  },
  backBtnText: { ...textPresets.bodyMedium, color: '#fff', fontWeight: '700' },
});
