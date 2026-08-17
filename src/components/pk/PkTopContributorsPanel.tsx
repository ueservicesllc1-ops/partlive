import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { PkGiftContribution } from '../../types/pk';

interface PkTopContributorsPanelProps {
  hostAId: string;
  hostBId: string;
  hostAName: string;
  hostBName: string;
  contributions: PkGiftContribution[];
}

export const PkTopContributorsPanel: React.FC<PkTopContributorsPanelProps> = ({
  hostAId,
  hostBId,
  hostAName,
  hostBName,
  contributions,
}) => {
  // Aggregate diamonds per sender for Host A
  const senderMapA = new Map<string, { senderId: string; name: string; diamonds: number }>();
  // Aggregate diamonds per sender for Host B
  const senderMapB = new Map<string, { senderId: string; name: string; diamonds: number }>();

  contributions.forEach((c) => {
    if (c.receiverHostId === hostAId) {
      const existing = senderMapA.get(c.senderId) || { senderId: c.senderId, name: 'Usuario', diamonds: 0 };
      existing.diamonds += c.diamonds || 0;
      senderMapA.set(c.senderId, existing);
    } else if (c.receiverHostId === hostBId) {
      const existing = senderMapB.get(c.senderId) || { senderId: c.senderId, name: 'Usuario', diamonds: 0 };
      existing.diamonds += c.diamonds || 0;
      senderMapB.set(c.senderId, existing);
    }
  });

  const topA = Array.from(senderMapA.values()).sort((a, b) => b.diamonds - a.diamonds).slice(0, 3);
  const topB = Array.from(senderMapB.values()).sort((a, b) => b.diamonds - a.diamonds).slice(0, 3);

  const MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <View style={styles.container}>
      {/* Host A Top 3 */}
      <View style={styles.column}>
        <Text style={styles.hostHeader} numberOfLines={1}>Top {hostAName}</Text>
        {topA.length === 0 ? (
          <Text style={styles.emptyText}>Sin aportes aún</Text>
        ) : (
          topA.map((item, idx) => (
            <View key={item.senderId} style={styles.itemRow}>
              <Text style={styles.medal}>{MEDALS[idx]}</Text>
              <Text style={styles.name} numberOfLines={1}>User #{item.senderId.slice(-4)}</Text>
              <Text style={styles.diamonds}>💎 {item.diamonds}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.divider} />

      {/* Host B Top 3 */}
      <View style={styles.column}>
        <Text style={styles.hostHeader} numberOfLines={1}>Top {hostBName}</Text>
        {topB.length === 0 ? (
          <Text style={styles.emptyText}>Sin aportes aún</Text>
        ) : (
          topB.map((item, idx) => (
            <View key={item.senderId} style={styles.itemRow}>
              <Text style={styles.medal}>{MEDALS[idx]}</Text>
              <Text style={styles.name} numberOfLines={1}>User #{item.senderId.slice(-4)}</Text>
              <Text style={styles.diamonds}>💎 {item.diamonds}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 22, 46, 0.85)',
    borderRadius: 14,
    padding: 10,
    marginHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  column: {
    flex: 1,
  },
  hostHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  medal: {
    fontSize: 10,
    marginRight: 4,
  },
  name: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    marginRight: 4,
  },
  diamonds: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  emptyText: {
    fontSize: 9,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
