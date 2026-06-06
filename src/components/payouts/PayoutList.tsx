import React from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../../theme';
import { HostPayout } from '../../types/payout';
import { PayoutListItem } from './PayoutListItem';

interface PayoutListProps {
  payouts: HostPayout[];
  onSelectPayout: (payout: HostPayout) => void;
  loading?: boolean;
}

export const PayoutList: React.FC<PayoutListProps> = ({
  payouts,
  onSelectPayout,
  loading = false,
}) => {
  if (loading && payouts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (payouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>💸</Text>
        <Text style={styles.emptyTitle}>Sin retiros registrados</Text>
        <Text style={styles.emptySubtitle}>
          Las solicitudes de retiro que realices aparecerán aquí para que puedas hacer seguimiento.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={payouts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PayoutListItem payout={item} onPress={() => onSelectPayout(item)} />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  center: {
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
