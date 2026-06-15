import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../theme';

interface Props {
  activeFilter: string;
  onChange: (filter: string) => void;
}

const FILTERS = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'No leídas' },
  { id: 'system', label: 'Sistema' },
  { id: 'game', label: 'Juegos' },
  { id: 'gift', label: 'Regalos' },
];

export const NotificationFilters: React.FC<Props> = ({ activeFilter, onChange }) => {
  return (
    <View style={styles.container}>
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.id;
        return (
          <TouchableOpacity
            key={f.id}
            onPress={() => onChange(f.id)}
            style={[styles.btn, isActive && styles.btnActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>{f.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#151221',
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#1E1B30',
    borderWidth: 1,
    borderColor: '#292440',
  },
  btnActive: {
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
  },
  text: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  textActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
