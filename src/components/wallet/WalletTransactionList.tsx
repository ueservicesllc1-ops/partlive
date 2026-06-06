import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { WalletTransaction } from '../../types';
import { WalletTransactionItem } from './WalletTransactionItem';
import { colors, spacing, textPresets } from '../../theme';

interface WalletTransactionListProps {
  transactions: WalletTransaction[];
}

export const WalletTransactionList: React.FC<WalletTransactionListProps> = ({ transactions }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Transacciones</Text>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>No hay transacciones aún.</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          scrollEnabled={false} // Since this is nested inside ScrollView in WalletScreen
          renderItem={({ item }) => <WalletTransactionItem tx={item} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: '#1E1B30',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292440',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...textPresets.bodyMedium,
    color: colors.textMuted,
  },
});
