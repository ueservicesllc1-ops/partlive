import React, { useState, useCallback, useRef } from 'react';
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

// ─── Types ────────────────────────────────────────────────────────────────────
type RPSChoice = 'rock' | 'paper' | 'scissors';
type RoundResult = 'win' | 'lose' | 'draw' | null;

const CHOICES: { id: RPSChoice; emoji: string; label: string }[] = [
  { id: 'rock', emoji: '🪨', label: 'Piedra' },
  { id: 'paper', emoji: '📄', label: 'Papel' },
  { id: 'scissors', emoji: '✂️', label: 'Tijeras' },
];

const TOTAL_ROUNDS = 3;

const determineWinner = (mine: RPSChoice, opponent: RPSChoice): RoundResult => {
  if (mine === opponent) return 'draw';
  if (
    (mine === 'rock' && opponent === 'scissors') ||
    (mine === 'scissors' && opponent === 'paper') ||
    (mine === 'paper' && opponent === 'rock')
  ) {
    return 'win';
  }
  return 'lose';
};

const getRandomChoice = (): RPSChoice => {
  const options: RPSChoice[] = ['rock', 'paper', 'scissors'];
  return options[Math.floor(Math.random() * 3)];
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface RockPaperScissorsGameProps {
  players: GamePlayer[];
  myUserId: string;
  onFinish: (scores: Record<string, number>) => void;
  onSendMove?: (moveType: string, payload: Record<string, any>) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export const RockPaperScissorsGame: React.FC<RockPaperScissorsGameProps> = ({
  players,
  myUserId,
  onFinish,
  onSendMove,
}) => {
  const [round, setRound] = useState(1);
  const [myChoice, setMyChoice] = useState<RPSChoice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<RPSChoice | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult>(null);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [localPlayers, setLocalPlayers] = useState<GamePlayer[]>(players);
  const [phase, setPhase] = useState<'picking' | 'revealing' | 'finished'>('picking');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Shake animation on reveal
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handlePick = useCallback(
    async (choice: RPSChoice) => {
      if (phase !== 'picking') return;
      const opponent = getRandomChoice(); // Single-player vs CPU in local mode
      const result = determineWinner(choice, opponent);
      triggerShake();

      setMyChoice(choice);
      setOpponentChoice(opponent);
      setRoundResult(result);
      setPhase('revealing');

      const pointsMe = result === 'win' ? 100 : result === 'draw' ? 30 : 0;
      const pointsOpp = result === 'lose' ? 100 : result === 'draw' ? 30 : 0;

      setMyScore(prev => prev + pointsMe);
      setOpponentScore(prev => prev + pointsOpp);

      setLocalPlayers(prev =>
        prev.map(p =>
          p.userId === myUserId
            ? { ...p, score: p.score + pointsMe, roundsWon: p.roundsWon + (result === 'win' ? 1 : 0) }
            : p,
        ),
      );

      await onSendMove?.('pick', { choice, opponent, result, round });

      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          setPhase('finished');
        } else {
          setRound(r => r + 1);
          setMyChoice(null);
          setOpponentChoice(null);
          setRoundResult(null);
          setPhase('picking');
        }
      }, 2000);
    },
    [phase, round, myUserId, onSendMove],
  );

  const resultLabel: Record<NonNullable<RoundResult>, string> = {
    win: '¡Ganaste esta ronda! 🎉',
    lose: 'Perdiste esta ronda 😅',
    draw: '¡Empate! 🤝',
  };

  const isWinner = myScore > opponentScore;

  return (
    <View style={styles.container}>
      <GameScoreBoard
        players={localPlayers}
        currentRound={round}
        totalRounds={TOTAL_ROUNDS}
        myUserId={myUserId}
      />

      <View style={styles.arena}>
        {/* My side */}
        <Animated.View
          style={[styles.side, { transform: [{ translateX: shakeAnim }] }]}
        >
          <Text style={styles.sideLabel}>Tú</Text>
          <Text style={styles.choiceEmoji}>
            {myChoice ? CHOICES.find(c => c.id === myChoice)?.emoji : '❓'}
          </Text>
          <Text style={styles.scoreNum}>{myScore}</Text>
        </Animated.View>

        {/* VS */}
        <View style={styles.vsContainer}>
          <Text style={styles.vs}>VS</Text>
          {roundResult && (
            <Text style={[styles.resultLabel, roundResult === 'win' && styles.resultWin, roundResult === 'lose' && styles.resultLose]}>
              {resultLabel[roundResult]}
            </Text>
          )}
        </View>

        {/* Opponent side (CPU) */}
        <View style={styles.side}>
          <Text style={styles.sideLabel}>CPU 🤖</Text>
          <Text style={styles.choiceEmoji}>
            {opponentChoice ? CHOICES.find(c => c.id === opponentChoice)?.emoji : '🤖'}
          </Text>
          <Text style={styles.scoreNum}>{opponentScore}</Text>
        </View>
      </View>

      {/* Choice buttons */}
      {phase === 'picking' && (
        <View style={styles.choices}>
          <Text style={styles.pickPrompt}>Elige tu jugada</Text>
          <View style={styles.choiceRow}>
            {CHOICES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={styles.choiceBtn}
                onPress={() => handlePick(c.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.choiceBtnEmoji}>{c.emoji}</Text>
                <Text style={styles.choiceBtnLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {phase === 'revealing' && (
        <Text style={styles.revealMsg}>Próxima ronda en 2 segundos...</Text>
      )}

      {phase === 'finished' && (
        <GameResultCard
          isWinner={isWinner}
          myPlayer={localPlayers.find(p => p.userId === myUserId) ?? null}
          players={localPlayers}
          coinsEarned={isWinner ? 60 : 15}
          xpEarned={isWinner ? 100 : 30}
          onPlayAgain={() => {
            setRound(1);
            setMyScore(0);
            setOpponentScore(0);
            setMyChoice(null);
            setOpponentChoice(null);
            setRoundResult(null);
            setLocalPlayers(players.map(p => ({ ...p, score: 0, roundsWon: 0 })));
            setPhase('picking');
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
    marginVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  side: { alignItems: 'center', gap: spacing.sm },
  sideLabel: { ...textPresets.caption, color: colors.textMuted },
  choiceEmoji: { fontSize: 52 },
  scoreNum: { ...textPresets.h2, color: colors.accent, fontWeight: '700' },
  vsContainer: { alignItems: 'center', gap: spacing.sm },
  vs: { ...textPresets.h2, color: colors.textDark, fontWeight: '900' },
  resultLabel: {
    ...textPresets.caption,
    color: colors.text,
    textAlign: 'center',
    maxWidth: 80,
  },
  resultWin: { color: colors.success },
  resultLose: { color: colors.error },
  choices: { gap: spacing.md },
  pickPrompt: { ...textPresets.h3, color: colors.text, textAlign: 'center' },
  choiceRow: { flexDirection: 'row', justifyContent: 'space-around', gap: spacing.md },
  choiceBtn: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  choiceBtnEmoji: { fontSize: 36 },
  choiceBtnLabel: { ...textPresets.caption, color: colors.textMuted, fontWeight: '600' },
  revealMsg: {
    ...textPresets.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
