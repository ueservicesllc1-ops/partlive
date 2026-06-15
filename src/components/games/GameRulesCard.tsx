import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';

interface Rule {
  icon: string;
  text: string;
}

interface GameRulesCardProps {
  rules: Rule[];
  title?: string;
}

export const GameRulesCard: React.FC<GameRulesCardProps> = ({
  rules,
  title = 'Reglas del Juego',
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>📋</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {rules.map((rule, i) => (
            <View key={i} style={styles.ruleRow}>
              <Text style={styles.ruleIcon}>{rule.icon}</Text>
              <Text style={styles.ruleText}>{rule.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  icon: { fontSize: 18 },
  title: { ...textPresets.bodyMedium, color: colors.text, fontWeight: '600', flex: 1 },
  chevron: { fontSize: 12, color: colors.textMuted },
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  ruleRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  ruleIcon: { fontSize: 16, marginTop: 1 },
  ruleText: { ...textPresets.caption, color: colors.textMuted, flex: 1, lineHeight: 18 },
});
