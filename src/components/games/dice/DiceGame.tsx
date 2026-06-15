import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors, spacing, textPresets } from '../../../theme';
import { GamePlayer } from '../../../types/game';
import { GameScoreBoard } from '../GameScoreBoard';
import { GameResultCard } from '../GameResultCard';

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_ROUNDS = 3;
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const rollDice = (): number => Math.floor(Math.random() * 6) + 1;

// ─── Props ────────────────────────────────────────────────────────────────────
interface DiceGameProps {
  players: GamePlayer[];
  myUserId: string;
  onFinish: (scores: Record<string, number>) => void;
  onSendMove?: (moveType: string, payload: Record<string, any>) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const DiceGame: React.FC<DiceGameProps> = ({
  players,
  myUserId,
  onFinish,
  onSendMove,
}) => {
  const [round, setRound] = useState(1);
  const [myRoll, setMyRoll] = useState<number | null>(null);
  const [cpuRoll, setCpuRoll] = useState<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'result' | 'finished'>('idle');
  const [myScore, setMyScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [localPlayers, setLocalPlayers] = useState<GamePlayer[]>(players);

  const diceAnim = useRef(new Animated.Value(0)).current;
  const shakeRef = useRef<Animated.CompositeAnimation | null>(null);

  const animateDice = () => {
    shakeRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(diceAnim, { toValue: 15, duration: 80, useNativeDriver: true }),
        Animated.timing(diceAnim, { toValue: -15, duration: 80, useNativeDriver: true }),
      ]),
      { iterations: 5 },
    );
    shakeRef.current.start();
  };

  const handleRoll = useCallback(async () => {
    if (phase !== 'idle') return;
    setPhase('rolling');
    setMyRoll(null);
    setCpuRoll(null);
    animateDice();

    // Simulate 1s "rolling" animation
    setTimeout(async () => {
      shakeRef.current?.stop();
      diceAnim.setValue(0);

      const me = rollDice();
      const cpu = rollDice();
      setMyRoll(me);
      setCpuRoll(cpu);

      const didWin = me > cpu;
      const isDraw = me === cpu;
      const pts = didWin ? 100 : isDraw ? 40 : 0;
      const cpuPts = !didWin && !isDraw ? 100 : isDraw ? 40 : 0;

      setMyScore(prev => prev + pts);
      setCpuScore(prev => prev + cpuPts);
      setLocalPlayers(prev =>
        prev.map(p =>
          p.userId === myUserId
            ? {
                ...p,
                score: p.score + pts,
                roundsWon: p.roundsWon + (didWin ? 1 : 0),
              }
            : p,
        ),
      );

      await onSendMove?.('roll', { myRoll: me, cpuRoll: cpu, pts, round });

      setPhase('result');

      // Advance after 2.5s
      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          setPhase('finished');
        } else {
          setRound(r => r + 1);
          setPhase('idle');
        }
      }, 2500);
    }, 1000);
  }, [phase, round, myUserId, onSendMove]);

  const isWinner = myScore > cpuScore;

  const roundResultText = () => {
    if (myRoll == null || cpuRoll == null) return '';
    if (myRoll > cpuRoll) return `🎉 ¡Ganaste! (${myRoll} vs ${cpuRoll})`;
    if (myRoll < cpuRoll) return `😅 Perdiste (${myRoll} vs ${cpuRoll})`;
    return `🤝 Empate (${myRoll} vs ${cpuRoll})`;
  };

  return (
    <View style={styles.container}>
      <GameScoreBoard
        players={localPlayers}
        currentRound={round}
        totalRounds={TOTAL_ROUNDS}
        myUserId={myUserId}
      />

      {/* Dice arena */}
      <View style={styles.arena}>
        {/* My dice */}
        <View style={styles.diceCol}>
          <Text style={styles.diceLabel}>Tú</Text>
          <Animated.Text
            style={[styles.diceFace, { transform: [{ translateX: diceAnim }] }]}
          >
            {myRoll !== null ? DICE_FACES[myRoll - 1] : (phase === 'rolling' ? DICE_FACES[Math.floor(Math.random() * 6)] : '🎲')}
          </Animated.Text>
          <Text style={styles.diceScore}>{myScore} pts</Text>
        </View>

        <Text style={styles.vs}>VS</Text>

        {/* CPU dice */}
        <View style={styles.diceCol}>
          <Text style={styles.diceLabel}>CPU 🤖</Text>
          <Text style={styles.diceFace}>
            {cpuRoll !== null ? DICE_FACES[cpuRoll - 1] : '🎲'}
          </Text>
          <Text style={styles.diceScore}>{cpuScore} pts</Text>
        </View>
      </View>

      {/* Round result */}
      {phase === 'result' && (
        <View style={styles.resultBanner}>
          <Text style={styles.resultText}>{roundResultText()}</Text>
        </View>
      )}

      {/* Roll button */}
      {(phase === 'idle') && (
        <TouchableOpacity style={styles.rollBtn} onPress={handleRoll} activeOpacity={0.85}>
          <Text style={styles.rollBtnText}>🎲 ¡Lanzar dados!</Text>
        </TouchableOpacity>
      )}

      {phase === 'rolling' && (
        <View style={styles.rollingMsg}>
          <Text style={styles.rollingText}>Lanzando...</Text>
        </View>
      )}

      {phase === 'result' && round < TOTAL_ROUNDS && (
        <Text style={styles.nextMsg}>Siguiente ronda en 2 segundos...</Text>
      )}

      {/* Result overlay */}
      {phase === 'finished' && (
        <GameResultCard
          isWinner={isWinner}
          myPlayer={localPlayers.find(p => p.userId === myUserId) ?? null}
          players={localPlayers}
          coinsEarned={isWinner ? 50 : 10}
          xpEarned={isWinner ? 80 : 25}
          onPlayAgain={() => {
            setRound(1);
            setMyScore(0);
            setCpuScore(0);
            setMyRoll(null);
            setCpuRoll(null);
            setLocalPlayers(players.map(p => ({ ...p, score: 0, roundsWon: 0 })));
            setPhase('idle');
          }}
          onExit={() => onFinish({ [myUserId]: myScore })}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  arena: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginVertical: spacing.xl,
  },
  diceCol: { alignItems: 'center', gap: spacing.sm },
  diceLabel: { ...textPresets.caption, color: colors.textMuted },
  diceFace: { fontSize: 72 },
  diceScore: { ...textPresets.bodyLarge, color: colors.accent, fontWeight: '700' },
  vs: { ...textPresets.h2, color: colors.textDark, fontWeight: '900' },
  resultBanner: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultText: { ...textPresets.bodyLarge, color: colors.text, fontWeight: '700' },
  rollBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  rollBtnText: { ...textPresets.h3, color: '#fff', fontWeight: '700' },
  rollingMsg: { alignItems: 'center', padding: spacing.xl },
  rollingText: { ...textPresets.h3, color: colors.textMuted },
  nextMsg: {
    ...textPresets.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
