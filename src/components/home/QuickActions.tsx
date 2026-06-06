import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export const QuickActions = ({ onAction }: QuickActionsProps) => {
  const actions = [
    { id: 'rooms', icon: '🎙️', label: 'Salas' },
    { id: 'lives', icon: '📺', label: 'Lives' },
    { id: 'games', icon: '🎮', label: 'Juegos' },
    { id: 'rankings', icon: '🏆', label: 'Ranking' },
    { id: 'events', icon: '🎉', label: 'Eventos' },
    { id: 'wallet', icon: '🪙', label: 'Billetera' },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity 
          key={action.id} 
          style={styles.actionItem}
          onPress={() => onAction(action.id)}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{action.icon}</Text>
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  actionItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    ...textPresets.caption,
    color: colors.text,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
