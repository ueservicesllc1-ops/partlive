import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ROOM_CATEGORIES, RoomCategoryType } from '../../constants/roomCategories';
import { colors, spacing, textPresets } from '../../theme';

interface RoomCategoryPickerProps {
  selectedCategory: RoomCategoryType;
  onSelectCategory: (category: RoomCategoryType) => void;
}

export const RoomCategoryPicker: React.FC<RoomCategoryPickerProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Selecciona una Categoría *</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {ROOM_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryCard,
                isSelected && styles.categoryCardSelected,
              ]}
              onPress={() => onSelectCategory(cat.id)}
            >
              <Text style={styles.emoji}>{cat.iconEmoji}</Text>
              <Text
                style={[
                  styles.label,
                  isSelected && styles.labelSelected,
                ]}
              >
                {cat.label}
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
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    ...textPresets.bodySmall,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  scrollContainer: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  categoryCard: {
    backgroundColor: '#1E1B30',
    borderWidth: 1,
    borderColor: '#292440',
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(127, 85, 240, 0.1)',
  },
  emoji: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  label: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
