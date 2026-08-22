import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, textPresets } from '../../../theme';
import { TriviaQuestion, GamePlayer, GameSession, GameMove } from '../../../types/game';
import { GameTimer } from '../GameTimer';
import { GameScoreBoard } from '../GameScoreBoard';
import { GameResultCard } from '../GameResultCard';
import { TRIVIA_CATEGORIES, getQuestionsForLevel } from './triviaData';
import { getUserTriviaProgress, unlockTriviaLevel } from '../../../services/firebase/firestore/triviaProgressService';

// ─── Constants ────────────────────────────────────────────────────────────────
const QUESTION_SECONDS = 15;
const POINTS_CORRECT_BASE = 100;
const POINTS_SPEED_BONUS = 50; 

// ─── Types ────────────────────────────────────────────────────────────────────
interface TriviaGameProps {
  session?: GameSession | null;
  currentMoves?: GameMove[];
  onFinish: (scores: Record<string, number>) => void;
  players: GamePlayer[];
  myUserId: string;
  onSendMove?: (moveType: string, payload: Record<string, any>) => Promise<void>;
}

type GamePhase = 'SELECT_CATEGORY' | 'SELECT_LEVEL' | 'PLAYING' | 'FINISHED';
type QuestionState = 'answering' | 'revealing' | 'done';

export const TriviaGame: React.FC<TriviaGameProps> = ({
  session,
  currentMoves = [],
  onFinish,
  players,
  myUserId,
  onSendMove,
}) => {
  const isHost = !session || session.hostId === myUserId;
  const isMultiplayer = !!session;

  // ── States ────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>('SELECT_CATEGORY');
  const [unlockedLevels, setUnlockedLevels] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  // Playing states
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [qState, setQState] = useState<QuestionState>('answering');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [localPlayers, setLocalPlayers] = useState<GamePlayer[]>(players);
  
  const questionStartTime = useRef(Date.now());
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ── 1. Fetch User Progress ──────────────────────────────────────────
  useEffect(() => {
    const fetchProgress = async () => {
      // In multiplayer, we use the host's progress to determine what's unlocked,
      // or we can use local user's progress. For campaign feel, we use host's progress.
      const targetUserId = isMultiplayer && session ? session.hostId : myUserId;
      const progress = await getUserTriviaProgress(targetUserId);
      setUnlockedLevels(progress);
      setIsLoadingProgress(false);
    };
    fetchProgress();
  }, [isMultiplayer, session?.hostId, myUserId]);

  // ── 2. Multiplayer Sync (Listen to host moves) ────────────────────────
  useEffect(() => {
    if (!isMultiplayer) return;
    
    // Look for category and level selections in moves
    const categoryMove = currentMoves.find(m => m.moveType === 'select_category');
    if (categoryMove && phase === 'SELECT_CATEGORY') {
      setSelectedCategory(categoryMove.payload.categoryId);
      setPhase('SELECT_LEVEL');
    }

    const levelMove = currentMoves.find(m => m.moveType === 'select_level');
    if (levelMove && phase === 'SELECT_LEVEL' && selectedCategory) {
      const lvl = levelMove.payload.level;
      setSelectedLevel(lvl);
      const qs = getQuestionsForLevel(selectedCategory, lvl);
      setQuestions(qs);
      setPhase('PLAYING');
    }
  }, [currentMoves, phase, selectedCategory, isMultiplayer]);

  // ── Actions ────────────────────────────────────────────────────────
  const handleSelectCategory = (categoryId: string) => {
    if (!isHost && isMultiplayer) return; // Only host chooses
    
    setSelectedCategory(categoryId);
    setPhase('SELECT_LEVEL');
    onSendMove?.('select_category', { categoryId });
  };

  const handleSelectLevel = (level: number) => {
    if (!isHost && isMultiplayer) return;
    if (!selectedCategory) return;
    
    const unlocked = unlockedLevels[selectedCategory] || 1;
    if (level > unlocked) return; // Locked!

    setSelectedLevel(level);
    const qs = getQuestionsForLevel(selectedCategory, level);
    setQuestions(qs);
    setPhase('PLAYING');
    onSendMove?.('select_level', { level });
  };

  // ── Playing Logic ──────────────────────────────────────────────────
  const currentQuestion = questions[qIndex];

  useEffect(() => {
    if (phase !== 'PLAYING' || !currentQuestion) return;
    
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
  }, [qIndex, phase, currentQuestion]);

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

      setScores(prev => ({
        ...prev,
        [myUserId]: (prev[myUserId] ?? 0) + points,
      }));

      setLocalPlayers(prev =>
        prev.map(p =>
          p.userId === myUserId ? { ...p, score: p.score + points } : p
        )
      );

      onSendMove?.('answer', {
        questionId: currentQuestion.id,
        selectedIndex: optionIndex,
        isCorrect,
        points,
        elapsedSeconds,
      });

      setTimeout(() => advanceQuestion(), 2000);
    },
    [qState, currentQuestion, myUserId, onSendMove]
  );

  const handleTimerExpire = useCallback(() => {
    if (qState !== 'answering') return;
    setQState('revealing');
    setSelectedOption(-1);
    setTimeout(() => advanceQuestion(), 2000);
  }, [qState]);

  const advanceQuestion = useCallback(() => {
    if (qIndex + 1 >= questions.length) {
      setPhase('FINISHED');
      
      // If we won/completed this level, unlock next!
      if (selectedCategory && selectedLevel !== null) {
        // Simple win condition: user got at least 1 question right to pass.
        // Or you can make it strict. Let's just unlock it if they finish the level.
        unlockTriviaLevel(myUserId, selectedCategory, selectedLevel);
      }
    } else {
      setQIndex(i => i + 1);
    }
  }, [qIndex, questions.length, selectedCategory, selectedLevel, myUserId]);


  // ── Render Helpers ─────────────────────────────────────────────────
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

  const isWinner = localPlayers.length > 0 &&
    localPlayers.reduce((best, p) => (p.score > best.score ? p : best), localPlayers[0]).userId === myUserId;

  // ── Render ─────────────────────────────────────────────────────────
  if (isLoadingProgress) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando progreso...</Text>
      </View>
    );
  }

  if (phase === 'SELECT_CATEGORY') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Elige una Categoría</Text>
        {!isHost && <Text style={styles.subtitle}>Esperando a que el host elija...</Text>}
        
        <ScrollView contentContainerStyle={styles.grid}>
          {TRIVIA_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCard, { borderColor: cat.color }]}
              onPress={() => handleSelectCategory(cat.id)}
              disabled={!isHost}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryLevel}>
                Nivel {unlockedLevels[cat.id] || 1}/10
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (phase === 'SELECT_LEVEL') {
    const category = TRIVIA_CATEGORIES.find(c => c.id === selectedCategory);
    const unlocked = unlockedLevels[selectedCategory!] || 1;

    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          {isHost && (
            <TouchableOpacity onPress={() => setPhase('SELECT_CATEGORY')}>
              <Text style={styles.backBtn}>← Volver</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{category?.name} - Niveles</Text>
        </View>
        {!isHost && <Text style={styles.subtitle}>Esperando a que el host elija...</Text>}

        <ScrollView contentContainerStyle={styles.levelGrid}>
          {Array.from({ length: 10 }).map((_, i) => {
            const lvl = i + 1;
            const isUnlocked = lvl <= unlocked;
            return (
              <TouchableOpacity
                key={lvl}
                style={[
                  styles.levelCard,
                  isUnlocked ? styles.levelUnlocked : styles.levelLocked,
                  isUnlocked && { borderColor: category?.color }
                ]}
                onPress={() => handleSelectLevel(lvl)}
                disabled={!isHost || !isUnlocked}
                activeOpacity={0.7}
              >
                <Text style={[styles.levelNum, !isUnlocked && styles.levelNumLocked]}>
                  {lvl}
                </Text>
                {!isUnlocked && <Text style={styles.lockIcon}>🔒</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  if (phase === 'FINISHED') {
    return (
      <View style={styles.container}>
        <GameResultCard
          isWinner={isWinner}
          myPlayer={localPlayers.find(p => p.userId === myUserId) ?? null}
          players={localPlayers}
          coinsEarned={isWinner ? 80 : 20}
          xpEarned={isWinner ? 120 : 40}
          onPlayAgain={() => {
            if (isHost) {
              setPhase('SELECT_CATEGORY');
              setScores({});
              setLocalPlayers(players.map(p => ({ ...p, score: 0 })));
              onSendMove?.('play_again', {});
            }
          }}
          onExit={() => onFinish(scores)}
        />
      </View>
    );
  }

  // PLAYING
  return (
    <View style={styles.container}>
      <GameScoreBoard
        players={localPlayers}
        currentRound={qIndex + 1}
        totalRounds={questions.length}
        myUserId={myUserId}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryTitle}>{TRIVIA_CATEGORIES.find(c => c.id === selectedCategory)?.name} - Nivel {selectedLevel}</Text>
          <View style={[styles.diffBadge, currentQuestion.difficulty === 'hard' && styles.diffHard, currentQuestion.difficulty === 'medium' && styles.diffMedium]}>
            <Text style={styles.diffText}>{currentQuestion.difficulty}</Text>
          </View>
        </View>

        <Animated.View style={[styles.questionCard, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.qHeader}>
            <Text style={styles.qCounter}>Pregunta {qIndex + 1}/{questions.length}</Text>
            <GameTimer key={timerKey} seconds={QUESTION_SECONDS} onExpire={handleTimerExpire} size="sm" />
          </View>
          <Text style={styles.question}>{currentQuestion.question}</Text>
        </Animated.View>

        <View style={styles.options}>
          {currentQuestion.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.option, getOptionStyle(i)]}
              onPress={() => handleAnswer(i)}
              disabled={qState !== 'answering'}
              activeOpacity={0.8}
            >
              <View style={styles.optionLabel}><Text style={styles.optionLetter}>{['A', 'B', 'C', 'D'][i]}</Text></View>
              <Text style={[styles.optionText, getOptionTextStyle(i)]}>{opt}</Text>
              {qState !== 'answering' && i === currentQuestion.correctIndex && <Text style={styles.checkMark}>✓</Text>}
              {qState !== 'answering' && i === selectedOption && selectedOption !== currentQuestion.correctIndex && <Text style={styles.crossMark}>✗</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {qState === 'revealing' && selectedOption === -1 && (
          <Text style={styles.timeoutMsg}>⏱ ¡Tiempo! La correcta era {['A','B','C','D'][currentQuestion.correctIndex]}</Text>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textMuted },
  title: { ...textPresets.h2, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...textPresets.caption, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, position: 'relative' },
  backBtn: { position: 'absolute', left: 0, color: colors.primary, fontWeight: 'bold' },
  
  // Category Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center', paddingTop: spacing.md },
  categoryCard: {
    width: '45%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  categoryIcon: { fontSize: 40, marginBottom: spacing.sm },
  categoryName: { ...textPresets.bodyMedium, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  categoryLevel: { ...textPresets.caption, color: colors.textMuted, marginTop: spacing.xs },

  // Level Grid
  levelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center', paddingTop: spacing.md },
  levelCard: {
    width: '28%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  levelUnlocked: { backgroundColor: colors.surface },
  levelLocked: { backgroundColor: colors.surfaceLight, borderColor: colors.border },
  levelNum: { ...textPresets.h2, color: colors.text },
  levelNumLocked: { color: colors.textMuted },
  lockIcon: { position: 'absolute', bottom: 8, right: 8, fontSize: 14 },

  // Playing UI
  scroll: { paddingBottom: spacing.xxl, gap: spacing.md },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.sm },
  categoryTitle: { ...textPresets.caption, color: colors.accent, fontWeight: '700' },
  diffBadge: { backgroundColor: colors.success + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  diffMedium: { backgroundColor: colors.warning + '22' },
  diffHard: { backgroundColor: colors.error + '22' },
  diffText: { fontSize: 9, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  questionCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qCounter: { ...textPresets.caption, color: colors.textMuted },
  question: { ...textPresets.h3, color: colors.text, lineHeight: 26 },
  options: { gap: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  optionDefault: { borderColor: colors.border },
  optionCorrect: { borderColor: colors.success, backgroundColor: colors.success + '22' },
  optionWrong: { borderColor: colors.error, backgroundColor: colors.error + '22' },
  optionLabel: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  optionLetter: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  optionText: { flex: 1, ...textPresets.bodyMedium, color: colors.text },
  optionTextCorrect: { color: colors.success, fontWeight: '700' },
  optionTextWrong: { color: colors.error },
  checkMark: { fontSize: 18, color: colors.success },
  crossMark: { fontSize: 18, color: colors.error },
  timeoutMsg: { ...textPresets.caption, color: colors.warning, textAlign: 'center', marginTop: spacing.sm },
});
