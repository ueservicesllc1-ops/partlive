import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { MAIN_ROUTES } from '../../app/routes';

export const SearchScreen = ({ navigation }: any) => {
  const [query, setQuery] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Buscar usuarios, salas o lives..."
          placeholderTextColor={colors.textDark}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>
      
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyText}>Escribe algo para buscar en toda la plataforma.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { marginRight: spacing.md },
  backIcon: { fontSize: 24, color: colors.text },
  input: { flex: 1, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8, fontSize: 16 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...textPresets.bodyMedium, color: colors.textMuted },
});
