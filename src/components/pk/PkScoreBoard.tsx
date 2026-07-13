import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '../../theme';
import { PkBattle } from '../../types/pk';

interface PkScoreBoardProps {
  battle: PkBattle;
}

export const PkScoreBoard: React.FC<PkScoreBoardProps> = ({ battle }) => {
  const scoreA = battle.hostAScore || 0;
  const scoreB = battle.hostBScore || 0;
  const total = scoreA + scoreB;

  // Calculate percentage width (min 10%, max 90% if not zero)
  let percentageA = 50;
  if (total > 0) {
    percentageA = Math.max(10, Math.min(90, Math.round((scoreA / total) * 100)));
  }

  const animPercentA = useRef(new Animated.Value(50)).current;
  const animPercentB = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animPercentA, {
        toValue: percentageA,
        duration: 350,
        useNativeDriver: false,
      }),
      Animated.timing(animPercentB, {
        toValue: 100 - percentageA,
        duration: 350,
        useNativeDriver: false,
      }),
    ]).start();
  }, [percentageA]);

  const renderPowerBadge = (hostKey: 'A' | 'B') => {
    const activePower = hostKey === 'A' ? battle.hostAActivePower : battle.hostBActivePower;
    const powerExpiry = hostKey === 'A' ? battle.hostAPowerExpiry : battle.hostBPowerExpiry;
    
    const opponentActivePower = hostKey === 'A' ? battle.hostBActivePower : battle.hostAActivePower;
    const opponentPowerExpiry = hostKey === 'A' ? battle.hostBPowerExpiry : battle.hostAPowerExpiry;
    
    let opponentBlocked = false;
    if (opponentActivePower === 'block_gifts' && opponentPowerExpiry) {
      const expiryMs = opponentPowerExpiry.toMillis ? opponentPowerExpiry.toMillis() : new Date(opponentPowerExpiry).getTime();
      if (Date.now() < expiryMs) {
        opponentBlocked = true;
      }
    }

    let currentActive = activePower;
    if (activePower && powerExpiry) {
      const expiryMs = powerExpiry.toMillis ? powerExpiry.toMillis() : new Date(powerExpiry).getTime();
      if (Date.now() > expiryMs) {
        currentActive = null;
      }
    }

    if (opponentBlocked) {
      return (
        <View style={[styles.powerActiveBadge, styles.powerActiveFreeze]}>
          <Text style={styles.powerActiveText}>❄️ Congelado</Text>
        </View>
      );
    }

    if (!currentActive) return null;

    if (currentActive === 'double_points') {
      return (
        <View style={[styles.powerActiveBadge, styles.powerActiveDouble]}>
          <Text style={styles.powerActiveText}>🔥 2x</Text>
        </View>
      );
    }
    if (currentActive === 'shield') {
      return (
        <View style={[styles.powerActiveBadge, styles.powerActiveShield]}>
          <Text style={styles.powerActiveText}>🛡️ Escudo</Text>
        </View>
      );
    }
    if (currentActive === 'block_gifts') {
      return (
        <View style={[styles.powerActiveBadge, styles.powerActiveBlock]}>
          <Text style={styles.powerActiveText}>❄️ Congelar</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.scoreTextRow}>
        <View style={[styles.badge, styles.badgeA]}>
          <View style={styles.badgeContent}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText} numberOfLines={1}>{battle.hostAName}</Text>
              {renderPowerBadge('A')}
            </View>
            <Text style={styles.scoreText}>{scoreA} Pts</Text>
          </View>
        </View>
        
        <View style={styles.vsBadge}>
          <Text style={styles.vsText}>PK</Text>
        </View>
        
        <View style={[styles.badge, styles.badgeB]}>
          <View style={styles.badgeContent}>
            <View style={styles.nameRow}>
              {renderPowerBadge('B')}
              <Text style={styles.nameText} numberOfLines={1}>{battle.hostBName}</Text>
            </View>
            <Text style={styles.scoreText}>{scoreB} Pts</Text>
          </View>
        </View>
      </View>

      <View style={styles.barContainer}>
        <Animated.View style={[styles.barA, { flex: animPercentA }]} />
        <Animated.View style={[styles.barB, { flex: animPercentB }]} />
      </View>

      {/* Power progress indicators */}
      <View style={styles.powerBarsRow}>
        <View style={styles.powerBarContainer}>
          <View style={styles.powerBarTrack}>
            <View style={[styles.powerBarFill, { width: `${Math.min(100, battle.hostAPowerBar || 0)}%`, backgroundColor: colors.accent }]} />
          </View>
          <Text style={styles.powerBarText}>⚡ {Math.min(100, Math.round(battle.hostAPowerBar || 0))}/100</Text>
        </View>
        
        <View style={[styles.powerBarContainer, { alignItems: 'flex-end' }]}>
          <View style={styles.powerBarTrack}>
            <View style={[styles.powerBarFill, { width: `${Math.min(100, battle.hostBPowerBar || 0)}%`, backgroundColor: colors.secondary }]} />
          </View>
          <Text style={styles.powerBarText}>⚡ {Math.min(100, Math.round(battle.hostBPowerBar || 0))}/100</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    width: '100%',
  },
  scoreTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    maxWidth: '45%',
    flex: 1,
  },
  badgeA: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: colors.accent,
    marginRight: 4,
  },
  badgeB: {
    backgroundColor: 'rgba(255, 51, 102, 0.12)',
    borderWidth: 1,
    borderColor: colors.secondary,
    marginLeft: 4,
  },
  badgeContent: {
    flexDirection: 'column',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  nameText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 80,
  },
  scoreText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  vsBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 10,
  },
  vsText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  barContainer: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  barA: {
    backgroundColor: colors.accent,
    height: '100%',
  },
  barB: {
    backgroundColor: colors.secondary,
    height: '100%',
  },
  powerBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  powerBarContainer: {
    width: '45%',
  },
  powerBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  powerBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  powerBarText: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },
  powerActiveBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  powerActiveDouble: {
    backgroundColor: '#FF8800',
  },
  powerActiveShield: {
    backgroundColor: '#00AAFF',
  },
  powerActiveBlock: {
    backgroundColor: '#9933FF',
  },
  powerActiveFreeze: {
    backgroundColor: '#00E5FF',
  },
  powerActiveText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: 'bold',
  },
});
