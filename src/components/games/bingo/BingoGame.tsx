import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { colors, spacing, textPresets } from '../../../theme';
import { GamePlayer } from '../../../types/game';
import { GameResultCard } from '../GameResultCard';

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_SIZE = 3; // 3x3 bingo card
const CALL_INTERVAL_MS = 3000; // call a number every 3 seconds
const MAX_NUMBER = 25; // numbers pool 1-25 for 3x3 bingo

// ─── Utilities ────────────────────────────────────────────────────────────────
const generateCard = (): number[][] => {
  const pool = Array.from({ length: MAX_NUMBER }, (_, i) => i + 1);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const card: number[][] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    card.push(shuffled.slice(row * GRID_SIZE, (row + 1) * GRID_SIZE));
  }
  // Free center space
  card[1][1] = 0;
  return card;
};

const checkBingo = (card: number[][], marked: Set<number>): boolean => {
  // Check rows
  for (const row of card) {
    if (row.every(n => n === 0 || marked.has(n))) return true;
  }
  // Check columns
  for (let col = 0; col < GRID_SIZE; col++) {
    if (card.every(row => row[col] === 0 || marked.has(row[col]))) return true;
  }
  // Check diagonals
  const diag1 = [card[0][0], card[1][1], card[2][2]];
  const diag2 = [card[0][2], card[1][1], card[2][0]];
  if (diag1.every(n => n === 0 || marked.has(n))) return true;
  if (diag2.every(n => n === 0 || marked.has(n))) return true;
  return false;
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface BingoGameProps {
  players: GamePlayer[];
  myUserId: string;
  onFinish: (scores: Record<string, number>) => void;
  onSendMove?: (moveType: string, payload: Record<string, any>) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const BingoGame: React.FC<BingoGameProps> = ({
  players,
  myUserId,
  onFinish,
  onSendMove,
}) => {
  const [card] = useState<number[][]>(() => generateCard());
  const [marked, setMarked] = useState<Set<number>>(new Set([0])); // 0 = free space
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [lastCalled, setLastCalled] = useState<number | null>(null);
  const [hasBingo, setHasBingo] = useState(false);
  const [finished, setFinished] = useState(false);
  const [gameOver, setGameOver] = useState(false); // all numbers called, no winner

  const callAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const poolRef = useRef<number[]>(
    Array.from({ length: MAX_NUMBER }, (_, i) => i + 1).sort(() => Math.random() - 0.5),
  );
  const calledCountRef = useRef(0);

  // Start calling numbers automatically
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (calledCountRef.current >= MAX_NUMBER) {
        clearInterval(intervalRef.current!);
        setGameOver(true);
        return;
      }
      const num = poolRef.current[calledCountRef.current];
      calledCountRef.current += 1;
      setLastCalled(num);
      setCalledNumbers(prev => [...prev, num]);

      // Animate
      callAnim.setValue(0);
      Animated.spring(callAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }, CALL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current!);
  }, []);

  // Auto-mark numbers on user card
  useEffect(() => {
    if (lastCalled === null) return;
    setMarked(prev => {
      const next = new Set(prev);
      next.add(lastCalled);
      // Check bingo after update
      if (checkBingo(card, next)) {
        clearInterval(intervalRef.current!);
        setHasBingo(true);
        setFinished(true);
        onSendMove?.('bingo', { calledNumbers: [...next], markedCount: next.size });
      }
      return next;
    });
  }, [lastCalled]);

  // Manual bingo claim
  const handleClaimBingo = useCallback(() => {
    if (checkBingo(card, marked)) {
      clearInterval(intervalRef.current!);
      setHasBingo(true);
      setFinished(true);
      onSendMove?.('bingo', { calledNumbers: [...marked], markedCount: marked.size });
    }
  }, [card, marked, onSendMove]);

  const renderCell = (num: number, row: number, col: number) => {
    const isFree = num === 0;
    const isMarked = marked.has(num) || isFree;
    const isLastCalled = num === lastCalled;

    return (
      <View
        key={`${row}-${col}`}
        style={[
          styles.cell,
          isMarked && styles.cellMarked,
          isFree && styles.cellFree,
          isLastCalled && styles.cellLast,
        ]}
      >
        {isFree ? (
          <Text style={styles.freeText}>★</Text>
        ) : (
          <Text style={[styles.cellNum, isMarked && styles.cellNumMarked]}>{num}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Called number display */}
      <View style={styles.calledBox}>
        <Text style={styles.calledLabel}>Número llamado</Text>
        <Animated.Text
          style={[
            styles.calledNum,
            { transform: [{ scale: callAnim }], opacity: callAnim },
          ]}
        >
          {lastCalled ?? '?'}
        </Animated.Text>
        <Text style={styles.calledCount}>{calledNumbers.length}/{MAX_NUMBER} llamados</Text>
      </View>

      {/* Bingo card */}
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          {['B', 'I', 'N'].map(l => (
            <View key={l} style={styles.cardHeaderCell}>
              <Text style={styles.cardHeaderText}>{l}</Text>
            </View>
          ))}
        </View>
        {card.map((row, ri) => (
          <View key={ri} style={styles.cardRow}>
            {row.map((num, ci) => renderCell(num, ri, ci))}
          </View>
        ))}
      </View>

      {/* Recently called numbers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
        <View style={styles.historyRow}>
          {[...calledNumbers].reverse().map((n, i) => (
            <View key={i} style={styles.historyBall}>
              <Text style={styles.historyNum}>{n}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bingo button */}
      {!finished && (
        <TouchableOpacity
          style={[styles.bingoBtn, !hasBingo && styles.bingoBtnDisabled]}
          onPress={handleClaimBingo}
          activeOpacity={0.9}
        >
          <Text style={styles.bingoBtnText}>🎉 ¡BINGO!</Text>
        </TouchableOpacity>
      )}

      {gameOver && !finished && (
        <View style={styles.gameOverBanner}>
          <Text style={styles.gameOverText}>¡Se acabaron los números! Nadie ganó esta vez.</Text>
          <TouchableOpacity onPress={() => onFinish({ [myUserId]: 0 })}>
            <Text style={styles.exitLink}>Salir</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Result overlay */}
      {finished && (
        <GameResultCard
          isWinner={hasBingo}
          myPlayer={players.find(p => p.userId === myUserId) ?? null}
          players={players}
          coinsEarned={hasBingo ? 120 : 10}
          xpEarned={hasBingo ? 150 : 20}
          onPlayAgain={() => {
            onFinish({ [myUserId]: hasBingo ? 500 : 0 });
          }}
          onExit={() => onFinish({ [myUserId]: hasBingo ? 500 : 0 })}
        />
      )}
    </View>
  );
};

const CELL_SIZE = 68;

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, alignItems: 'center' },
  calledBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    minWidth: 160,
  },
  calledLabel: { ...textPresets.caption, color: colors.textMuted, marginBottom: 4 },
  calledNum: { fontSize: 64, fontWeight: '900', color: colors.accent },
  calledCount: { ...textPresets.caption, color: colors.textDark, marginTop: 4 },
  cardContainer: { gap: 4, marginBottom: spacing.lg },
  cardHeader: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  cardHeaderCell: {
    width: CELL_SIZE,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: { fontWeight: '900', color: '#fff', fontSize: 16 },
  cardRow: { flexDirection: 'row', gap: 4 },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellMarked: { backgroundColor: colors.primary + '33', borderColor: colors.primary },
  cellFree: { backgroundColor: colors.gold + '22', borderColor: colors.gold },
  cellLast: { borderColor: colors.accent, borderWidth: 2 },
  cellNum: { fontSize: 22, fontWeight: '700', color: colors.text },
  cellNumMarked: { color: colors.primary },
  freeText: { fontSize: 22, color: colors.gold },
  historyScroll: { maxHeight: 44, marginBottom: spacing.lg },
  historyRow: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.xs },
  historyBall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyNum: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  bingoBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.sm,
  },
  bingoBtnDisabled: { opacity: 0.5 },
  bingoBtnText: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  gameOverBanner: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameOverText: { ...textPresets.bodyMedium, color: colors.textMuted, textAlign: 'center' },
  exitLink: { color: colors.primary, fontWeight: '700' },
});
