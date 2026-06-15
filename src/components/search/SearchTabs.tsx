import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../../theme';
import { SearchEntityType } from '../../types/search';

interface SearchTabsProps {
  selectedType: SearchEntityType | 'all';
  onSelectType: (type: SearchEntityType | 'all') => void;
}

interface TabOption {
  key: SearchEntityType | 'all';
  label: string;
}

export const SearchTabs: React.FC<SearchTabsProps> = ({ selectedType, onSelectType }) => {
  const tabs: TabOption[] = [
    { key: 'all', label: 'Todo' },
    { key: 'user', label: 'Usuarios' },
    { key: 'host', label: 'Hosts' },
    { key: 'room', label: 'Salas' },
    { key: 'live', label: 'Lives' },
    { key: 'game', label: 'Juegos' },
    { key: 'event', label: 'Eventos' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tabs.map(tab => {
          const active = selectedType === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelectType(tab.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
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
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginRight: spacing.xs,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.surfaceLight,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: 'bold',
  },
});
