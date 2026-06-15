import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ReportReason } from '../../types';
import { REPORT_REASONS } from '../../constants/moderation';
import { colors, spacing } from '../../theme';

interface ReportReasonSelectorProps {
  selectedReason: ReportReason | null;
  onSelectReason: (reason: ReportReason) => void;
}

export const ReportReasonSelector: React.FC<ReportReasonSelectorProps> = ({
  selectedReason,
  onSelectReason,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona el motivo del reporte</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {REPORT_REASONS.map((item) => {
          const isSelected = selectedReason === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              activeOpacity={0.8}
              style={[
                styles.reasonBtn,
                isSelected && styles.reasonBtnSelected,
              ]}
              onPress={() => onSelectReason(item.value)}
            >
              <Text
                style={[
                  styles.reasonText,
                  isSelected && styles.reasonTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  title: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  scrollContent: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  reasonBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  reasonText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  reasonTextSelected: {
    color: colors.text,
    fontWeight: 'bold',
  },
});
