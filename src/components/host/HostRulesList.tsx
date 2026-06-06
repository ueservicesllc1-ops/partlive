import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { HostRule } from '../../types';

// Fallback rules shown if Firestore is empty
export const FALLBACK_HOST_RULES: HostRule[] = [
  { id: 'r1', title: 'Respeta a todos los usuarios', description: 'Mantén un trato respetuoso y amable con toda la comunidad en todo momento.', isActive: true, sortOrder: 1 },
  { id: 'r2', title: 'No contenido sexual o explícito', description: 'Está prohibido emitir contenido sexual, desnudos o material adulto.', isActive: true, sortOrder: 2 },
  { id: 'r3', title: 'No acoso ni discriminación', description: 'No toleramos el acoso, bullying ni discriminación por ningún motivo.', isActive: true, sortOrder: 3 },
  { id: 'r4', title: 'No pedir pagos externos', description: 'No solicites pagos fuera de la plataforma. Solo usa el sistema de gifts oficial.', isActive: true, sortOrder: 4 },
  { id: 'r5', title: 'No fraudes ni promesas falsas', description: 'Está prohibido realizar sorteos falsos, fraudes o prometer regalos que no entregarás.', isActive: true, sortOrder: 5 },
  { id: 'r6', title: 'No compartir datos privados', description: 'No compartas información personal de otros usuarios sin su consentimiento.', isActive: true, sortOrder: 6 },
  { id: 'r7', title: 'Cumple las reglas de moderación', description: 'Respeta las decisiones de los moderadores. El abuso de poder puede resultar en suspensión.', isActive: true, sortOrder: 7 },
  { id: 'r8', title: 'Los diamonds se revisan antes de payouts', description: 'La plataforma puede auditar tu actividad antes de aprobar cualquier retiro.', isActive: true, sortOrder: 8 },
];

interface Props {
  rules?: HostRule[];
}

export const HostRulesList: React.FC<Props> = ({ rules }) => {
  const displayRules = rules && rules.length > 0 ? rules : FALLBACK_HOST_RULES;

  return (
    <View style={styles.container}>
      {displayRules.map((rule, i) => (
        <View key={rule.id} style={styles.ruleItem}>
          <View style={styles.numberCircle}>
            <Text style={styles.number}>{i + 1}</Text>
          </View>
          <View style={styles.ruleContent}>
            <Text style={styles.ruleTitle}>{rule.title}</Text>
            <Text style={styles.ruleDesc}>{rule.description}</Text>
          </View>
        </View>
      ))}

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ El incumplimiento de estas reglas puede resultar en la suspensión temporal o permanente de tu cuenta de host. Los diamonds no representan dinero ni ingresos garantizados hasta que el sistema de payouts esté activo.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  ruleItem: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  number: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  ruleContent: {
    flex: 1,
    gap: 2,
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  ruleDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  disclaimer: {
    backgroundColor: colors.warning + '15',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 17,
  },
});
