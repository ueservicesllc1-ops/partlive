import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { GameSession } from '../../types/game';
import { colors, spacing, textPresets } from '../../theme';

interface AvailableSessionsListProps {
  sessions: GameSession[];
  onJoinSession: (session: GameSession) => void;
  loading?: boolean;
}

export const AvailableSessionsList: React.FC<AvailableSessionsListProps> = ({
  sessions,
  onJoinSession,
  loading = false,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={styles.loadingText}>Buscando partidas disponibles...</Text>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎮</Text>
        <Text style={styles.emptyText}>No hay partidas disponibles en este momento.</Text>
        <Text style={styles.emptySubtext}>¡Crea una partida pública para que otros se unan!</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: GameSession }) => {
    const isFull = item.playerCount >= item.maxPlayers;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.hostInfo}>
            <Text style={styles.hostAvatar}>👤</Text>
            <View>
              <Text style={styles.hostName}>Host: {item.hostId.slice(0, 6)}</Text>
              <Text style={styles.gameInfo}>
                {item.region ? `${item.region} • ` : ''}
                {item.language ? `${item.language} • ` : ''}
                {item.skillLevel && item.skillLevel !== 'any' ? `${item.skillLevel}` : 'Cualquier nivel'}
              </Text>
            </View>
          </View>
          <View style={styles.playerBadge}>
            <Text style={styles.playerCountText}>
              👥 {item.playerCount}/{item.maxPlayers}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.statusText}>
            {item.status === 'ready' ? 'Cuenta regresiva...' : 'Esperando jugadores...'}
          </Text>
          <TouchableOpacity
            style={[styles.joinButton, isFull && styles.disabledButton]}
            onPress={() => onJoinSession(item)}
            disabled={isFull}
          >
            <Text style={styles.joinButtonText}>{isFull ? 'Llena' : 'Unirse'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={sessions}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: { paddingBottom: spacing.lg },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: { ...textPresets.caption, color: colors.textMuted },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161224',
    borderRadius: 16,
    marginVertical: spacing.md,
  },
  emptyIcon: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { ...textPresets.bodyMedium, color: colors.text, fontWeight: '700', textAlign: 'center' },
  emptySubtext: { ...textPresets.caption, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  card: {
    backgroundColor: '#1E1935',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#2D274A',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hostInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hostAvatar: { fontSize: 24 },
  hostName: { ...textPresets.bodyMedium, color: colors.text, fontWeight: '700' },
  gameInfo: { ...textPresets.caption, color: colors.textMuted },
  playerBadge: {
    backgroundColor: colors.primary + '22',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  playerCountText: { ...textPresets.caption, color: colors.primary, fontWeight: '700' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: { ...textPresets.caption, color: colors.accent, fontWeight: '600' },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
    borderRadius: 10,
  },
  disabledButton: { backgroundColor: '#332E4A' },
  joinButtonText: { ...textPresets.bodyMedium, color: '#FFF', fontWeight: '700' },
});
