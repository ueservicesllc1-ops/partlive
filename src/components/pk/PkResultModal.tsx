import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { PkBattle } from '../../types/pk';
import { formatCoins } from '../../utils/formatNumbers';

interface PkResultModalProps {
  visible: boolean;
  battle: PkBattle | null;
  onClose: () => void;
}

export const PkResultModal: React.FC<PkResultModalProps> = ({
  visible,
  battle,
  onClose,
}) => {
  if (!battle) return null;

  const isDraw = battle.result === 'draw' || battle.hostAScore === battle.hostBScore;
  const isHostAWin = battle.result === 'hostA_win' || battle.hostAScore > battle.hostBScore;
  const winnerName = isDraw ? 'Empate' : isHostAWin ? battle.hostAName : battle.hostBName;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.emoji}>{isDraw ? '🤝' : '🏆'}</Text>
          <Text style={styles.title}>
            {isDraw ? '¡DUELO EN EMPATE!' : `¡VICTORIA PARA ${winnerName.toUpperCase()}!`}
          </Text>

          {/* Final Scoreboard */}
          <View style={styles.scoreCard}>
            <View style={styles.hostCol}>
              <Text style={styles.hostName} numberOfLines={1}>{battle.hostAName}</Text>
              <Text style={styles.scoreText}>💎 {formatCoins(battle.hostAScore)}</Text>
            </View>

            <Text style={styles.vsText}>VS</Text>

            <View style={styles.hostCol}>
              <Text style={styles.hostName} numberOfLines={1}>{battle.hostBName}</Text>
              <Text style={styles.scoreText}>💎 {formatCoins(battle.hostBScore)}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Total Regalos: {battle.hostAGiftsCount + battle.hostBGiftsCount}</Text>
            <Text style={styles.statLabel}>Diamantes Totales: 💎 {formatCoins(battle.hostADiamonds + battle.hostBDiamonds)}</Text>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#1E1B30',
    borderRadius: 24,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141124',
    borderRadius: 16,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  hostCol: {
    flex: 1,
    alignItems: 'center',
  },
  hostName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.accent,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textMuted,
    marginHorizontal: 8,
  },
  statsRow: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginVertical: 2,
  },
  closeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
