import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../../theme';

interface DrawGuessPlaceholderProps {
  onBack: () => void;
}

export const DrawGuessPlaceholder: React.FC<DrawGuessPlaceholderProps> = ({ onBack }) => (
  <View style={styles.container}>
    <Text style={styles.emoji}>🎨</Text>
    <Text style={styles.title}>Draw & Guess</Text>
    <Text style={styles.subtitle}>Próximamente</Text>
    <Text style={styles.desc}>
      ¡Dibuja la palabra secreta y deja que tus amigos adivinen!{'\n'}
      Esta función estará disponible muy pronto.
    </Text>
    <View style={styles.features}>
      {[
        '🖊️ Canvas de dibujo en tiempo real',
        '💬 Chat para adivinar palabras',
        '⏱️ Rondas cronometradas',
        '🪙 Monedas por adivinar primero',
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
