import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, spacing } from '../../theme';
import { PkBattle } from '../../types/pk';

interface PkHostPanelProps {
  battle: PkBattle;
}

export const PkHostPanel: React.FC<PkHostPanelProps> = ({ battle }) => {
  const scoreA = battle.hostAScore || 0;
  const scoreB = battle.hostBScore || 0;

  const hostAWinning = scoreA > scoreB;
  const hostBWinning = scoreB > scoreA;

  return (
    <View style={styles.container}>
      {/* Host A */}
      <View style={styles.hostSection}>
        <View style={styles.avatarWrapper}>
          {battle.hostAPhotoURL ? (
            <Image source={{ uri: battle.hostAPhotoURL }} style={[styles.avatar, hostAWinning && styles.winningBorder]} />
          ) : (
            <View style={[styles.avatarPlaceholder, hostAWinning && styles.winningBorder]}>
              <Text style={styles.avatarLetter}>{battle.hostAName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {hostAWinning && <Text style={styles.crownIcon}>👑</Text>}
        </View>
        <Text style={styles.hostName} numberOfLines={1}>{battle.hostAName}</Text>
        <Text style={styles.roleLabel}>Desafiante</Text>
      </View>

      {/* VS Separator */}
      <View style={styles.vsSection}>
        <Text style={styles.vsText}>⚡ VS ⚡</Text>
      </View>

      {/* Host B */}
      <View style={styles.hostSection}>
        <View style={styles.avatarWrapper}>
          {battle.hostBPhotoURL ? (
            <Image source={{ uri: battle.hostBPhotoURL }} style={[styles.avatar, hostBWinning && styles.winningBorder]} />
          ) : (
            <View style={[styles.avatarPlaceholder, hostBWinning && styles.winningBorder]}>
              <Text style={styles.avatarLetter}>{battle.hostBName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {hostBWinning && <Text style={styles.crownIcon}>👑</Text>}
        </View>
        <Text style={styles.hostName} numberOfLines={1}>{battle.hostBName}</Text>
        <Text style={styles.roleLabel}>Contendiente</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(21, 18, 33, 0.85)',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  hostSection: {
    alignItems: 'center',
    width: '35%',
  },
  vsSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surfaceLight,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarLetter: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  winningBorder: {
    borderWidth: 2,
    borderColor: colors.gold,
  },
  crownIcon: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    fontSize: 16,
  },
  hostName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  roleLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
});
