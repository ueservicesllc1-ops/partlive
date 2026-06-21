import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';

interface MaxMicSelectorProps {
  maxMics: number;
  onSelectMaxMics: (mics: number) => void;
}

export const MaxMicSelector: React.FC<MaxMicSelectorProps> = ({
  maxMics,
  onSelectMaxMics,
}) => {
  const MIC_OPTIONS = [2, 4, 6, 8];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Cantidad de Micrófonos *</Text>
      <View style={styles.row}>
        {MIC_OPTIONS.map(opt => {
          const isSelected = maxMics === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => onSelectMaxMics(opt)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {opt} Mics
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  label: {
    ...textPresets.bodySmall,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#1E1B30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292440',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(127, 85, 240, 0.1)',
  },
  optionText: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  optionTextSelected: {
    color: colors.primary,
  },
});
