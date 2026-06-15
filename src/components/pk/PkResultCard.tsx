import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, spacing } from '../../theme';
import { PkBattle } from '../../types/pk';

interface PkResultCardProps {
  battle: PkBattle;
  currentUserId?: string;
}

export const PkResultCard: React.FC<PkResultCardProps> = ({ battle, currentUserId }) => {
  const scoreA = battle.hostAScore || 0;
  const scoreB = battle.hostBScore || 0;

  const isHostA = battle.hostAId === currentUserId;
  const isHostB = battle.hostBId === currentUserId;

  let outcomeText = 'Terminó la batalla PK';
  let isWinner = false;
  let isDraw = battle.result === 'draw';

  if (battle.winnerId) {
    isWinner = battle.winnerId === currentUserId;
    if (isWinner) {
      outcomeText = '🎉 ¡Has ganado!';
    } else if (isHostA || isHostB) {
      outcomeText = '😢 Has perdido';
    } else {
      outcomeText = battle.winnerId === battle.hostAId ? `🏆 Ganador: ${battle.hostAName}` : `🏆 Ganador: ${battle.hostBName}`;
    }
  } else if (isDraw) {
    outcomeText = '⚡ ¡Empate!';
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{outcomeText}</Text>

      <View style={styles.hostsRow}>
        <View style={styles.hostColumn}>
          {battle.hostAPhotoURL ? (
            <Image source={{ uri: battle.hostAPhotoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{battle.hostAName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>{battle.hostAName}</Text>
          <Text style={styles.score}>{scoreA} Pts</Text>
        </View>

        <Text style={styles.vs}>VS</Text>

        <View style={styles.hostColumn}>
          {battle.hostBPhotoURL ? (
            <Image source={{ uri: battle.hostBPhotoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>{battle.hostBName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name} numberOfLines={1}>{battle.hostBName}</Text>
          <Text style={styles.score}>{scoreB} Pts</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  title: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  hostsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  hostColumn: {
    alignItems: 'center',
    width: '40%',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: spacing.xs,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarLetter: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  score: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  vs: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
