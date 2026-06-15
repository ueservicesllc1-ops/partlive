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
import { TriviaQuestion } from '../../../types/game';
import { GameTimer } from '../GameTimer';
import { GameScoreBoard } from '../GameScoreBoard';
import { GameResultCard } from '../GameResultCard';
import { getRandomQuestions } from './triviaData';
import { GamePlayer } from '../../../types/game';

// ─── Constants ────────────────────────────────────────────────────────────────
const QUESTION_SECONDS = 15;
const TOTAL_QUESTIONS = 5;
const POINTS_CORRECT_BASE = 100;
const POINTS_SPEED_BONUS = 50; // extra if answered in <5s

// ─── Types ────────────────────────────────────────────────────────────────────
interface TriviaGameProps {
  /** Called by parent (GameSessionScreen) when game ends */
  onFinish: (scores: Record<string, number>) => void;
  /** Players in session — for scoreboard */
  players: GamePlayer[];
  myUserId: string;
  /** Submit move callback (writes to Firestore) */
  onSendMove?: (moveType: string, payload: Record<string, any>) => Promise<void>;
}

type QuestionState = 'answering' | 'revealing' | 'done';

// ─── Component ────────────────────────────────────────────────────────────────
export const TriviaGame: React.FC<TriviaGameProps> = ({
  onFinish,
  players,
  myUserId,
  onSendMove,
}) => {
  const [questions] = useState<TriviaQuestion[]>(() => getRandomQuestions(TOTAL_QUESTIONS));
  const [qIndex, setQIndex] = useState(0);
  const [qState, setQState] = useState<QuestionState>('answering');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [localPlayers, setLocalPlayers] = useState<GamePlayer[]>(players);
  const [finished, setFinished] = useState(false);

  const questionStartTime = useRef(Date.now());
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[qIndex];

  // ── Animate slide-in on question change ───────────────────────────────────
  useEffect(() => {
    slideAnim.setValue(50);
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 6,
      useNativeDriver: true,
    }).start();
    questionStartTime.current = Date.now();
    setQState('answering');
    setSelectedOption(null);
    setTimerKey(k => k + 1);
  }, [qIndex]);

  // ── Handle answer ─────────────────────────────────────────────────────────
  const handleAnswer = useCallback(
    async (optionIndex: number) => {
      if (qState !== 'answering') return;
      setSelectedOption(optionIndex);
      setQState('revealing');

      const elapsedSeconds = (Date.now() - questionStartTime.current) / 1000;
      const isCorrect = optionIndex === currentQuestion.correctIndex;
      let points = 0;
      if (isCorrect) {
        points = POINTS_CORRECT_BASE + (elapsedSeconds < 5 ? POINTS_SPEED_BONUS : 0);
      }

      // Update local scores
      setScores(prev => ({
        ...prev,
        [myUserId]: (prev[myUserId] ?? 0) + points,
      }));

      // Update local players list for scoreboard
      setLocalPlayers(prev =>
        prev.map(p =>
          p.userId === myUserId
            ? { ...p, score: p.score + points }
            : p,
        ),
      );

      // Write move to Firestore (fire and forget)
      onSendMove?.('answer', {
        questionId: currentQuestion.id,
        selectedIndex: optionIndex,
        isCorrect,
        points,
        elapsedSeconds,
      });

      // Auto-advance after 2s
      setTimeout(() => advanceQuestion(), 2000);
    },
    [qState, currentQuestion, myUserId, onSendMove],
  );

  // ── Timer expired ─────────────────────────────────────────────────────────
  const handleTimerExpire = useCallback(() => {
    if (qState !== 'answering') return;
    setQState('revealing');
    setSelectedOption(-1); // -1 = timeout
    setTimeout(() => advanceQuestion(), 2000);
  }, [qState]);

  // ── Advance to next question or finish ────────────────────────────────────
  const advanceQuestion = useCallback(() => {
    if (qIndex + 1 >= TOTAL_QUESTIONS) {
      setFinished(true);
      onFinish(scores);
    } else {
      setQIndex(i => i + 1);
    }
  }, [qIndex, scores, onFinish]);

  // ─── Option button color logic ────────────────────────────────────────────
  const getOptionStyle = (index: number) => {
    if (qState === 'answering') return styles.optionDefault;
    if (index === currentQuestion.correctIndex) return styles.optionCorrect;
    if (index === selectedOption && selectedOption !== currentQuestion.correctIndex) {
      return styles.optionWrong;
    }
    return styles.optionDefault;
  };

  const getOptionTextStyle = (index: number) => {
    if (qState === 'answering') return styles.optionText;
    if (index === currentQuestion.correctIndex) return styles.optionTextCorrect;
    if (index === selectedOption && selectedOption !== currentQuestion.correctIndex) {
      return styles.optionTextWrong;
    }
    return styles.optionText;
  };

  // ─── Scoreboard players ───────────────────────────────────────────────────
  const isWinner =
    finished &&
    localPlayers.length > 0 &&
    localPlayers.reduce((best, p) => (p.score > best.score ? p : best), localPlayers[0])
      .userId === myUserId;

  return (
    <View style={styles.container}>
      {/* Scoreboard */}
      <GameScoreBoard
        players={localPlayers}
        currentRound={qIndex + 1}
        totalRounds={TOTAL_QUESTIONS}
        myUserId={myUserId}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Category chip */}
        <View style={styles.categoryRow}>
          <Text style={styles.category}>{currentQuestion.category}</Text>
          <View
            style={[
              styles.diffBadge,
              currentQuestion.difficulty === 'hard' && styles.diffHard,
              currentQuestion.difficulty === 'medium' && styles.diffMedium,
            ]}
          >
            <Text style={styles.diffText}>{currentQuestion.difficulty}</Text>
          </View>
        </View>

        {/* Question card */}
        <Animated.View
          style={[styles.questionCard, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.qHeader}>
            <Text style={styles.qCounter}>
              Pregunta {qIndex + 1}/{TOTAL_QUESTIONS}
            </Text>
            <GameTimer
              key={timerKey}
              seconds={QUESTION_SECONDS}
              onExpire={handleTimerExpire}
              size="sm"
            />
          </View>
          <Text style={styles.question}>{currentQuestion.question}</Text>
        </Animated.View>

        {/* Options */}
        <View style={styles.options}>
          {currentQuestion.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.option, getOptionStyle(i)]}
              onPress={() => handleAnswer(i)}
              disabled={qState !== 'answering'}
              activeOpacity={0.8}
            >
              <View style={styles.optionLabel}>
                <Text style={styles.optionLetter}>
                  {['A', 'B', 'C', 'D'][i]}
                </Text>
              </View>
              <Text style={[styles.optionText, getOptionTextStyle(i)]}>{opt}</Text>
              {qState !== 'answering' && i === currentQuestion.correctIndex && (
                <Text style={styles.checkMark}>✓</Text>
              )}
              {qState !== 'answering' &&
                i === selectedOption &&
                selectedOption !== currentQuestion.correctIndex && (
                  <Text style={styles.crossMark}>✗</Text>
                )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Timeout message */}
        {qState === 'revealing' && selectedOption === -1 && (
          <Text style={styles.timeoutMsg}>⏱ ¡Tiempo! La respuesta correcta era la opción {['A','B','C','D'][currentQuestion.correctIndex]}</Text>
        )}
      </ScrollView>

      {/* Result Overlay */}
      {finished && (
        <GameResultCard
          isWinner={isWinner}
          myPlayer={localPlayers.find(p => p.userId === myUserId) ?? null}
          players={localPlayers}
          coinsEarned={isWinner ? 80 : 20}
          xpEarned={isWinner ? 120 : 40}
          onPlayAgain={() => {
            setQIndex(0);
            setScores({});
            setLocalPlayers(players.map(p => ({ ...p, score: 0 })));
            setFinished(false);
          }}
          onExit={() => onFinish(scores)}
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  scroll: { paddingBottom: spacing.xxl, gap: spacing.md },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  category: { ...textPresets.caption, color: colors.accent, fontWeight: '700' },
  diffBadge: {
    backgroundColor: colors.success + '22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  diffMedium: { backgroundColor: colors.warning + '22' },
  diffHard: { backgroundColor: colors.error + '22' },
  diffText: { fontSize: 9, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qCounter: { ...textPresets.caption, color: colors.textMuted },
  question: { ...textPresets.h3, color: colors.text, lineHeight: 26 },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  optionDefault: { borderColor: colors.border },
  optionCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.success + '22',
  },
  optionWrong: {
    borderColor: colors.error,
    backgroundColor: colors.error + '22',
  },
  optionLabel: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetter: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  optionText: { flex: 1, ...textPresets.bodyMedium, color: colors.text },
  optionTextCorrect: { color: colors.success, fontWeight: '700' },
  optionTextWrong: { color: colors.error },
  checkMark: { fontSize: 18, color: colors.success },
  crossMark: { fontSize: 18, color: colors.error },
  timeoutMsg: {
    ...textPresets.caption,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
