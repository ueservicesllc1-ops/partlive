import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { colors, spacing, textPresets } from '../../theme';
import { useGameSession } from '../../hooks/useGameSession';
import { GameSessionLobby } from '../../components/games/GameSessionLobby';
import { GameScoreBoard } from '../../components/games/GameScoreBoard';

// Game engines
import { TriviaGame } from '../../components/games/trivia/TriviaGame';
import { RockPaperScissorsGame } from '../../components/games/rps/RockPaperScissorsGame';
import { DiceGame } from '../../components/games/dice/DiceGame';
import { BingoGame } from '../../components/games/bingo/BingoGame';
import { DrawGuessPlaceholder } from '../../components/games/placeholder/DrawGuessPlaceholder';
import { LudoPlaceholder } from '../../components/games/placeholder/LudoPlaceholder';

// ─── Countdown overlay ────────────────────────────────────────────────────────
const CountdownOverlay: React.FC<{ count: number }> = ({ count }) => (
  <View style={overlayStyles.container}>
    <Text style={overlayStyles.count}>{count}</Text>
    <Text style={overlayStyles.label}>¡Prepárate!</Text>
  </View>
);

const overlayStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  count: { fontSize: 96, fontWeight: '900', color: colors.accent },
  label: { ...textPresets.h2, color: colors.text, marginTop: spacing.md },
});

// ─── Local/offline game (no Firestore session) ────────────────────────────────
const LOCAL_PREFIX = 'local_';

// ─── Component ────────────────────────────────────────────────────────────────
export const GameSessionScreen = ({ route, navigation }: any) => {
  const { sessionId, gameSlug, gameTitle } = route.params ?? {};
  const currentUser = auth().currentUser;
  const uid = currentUser?.uid ?? 'guest';
  const username = currentUser?.displayName ?? 'Jugador';

  const isLocalSession = String(sessionId).startsWith(LOCAL_PREFIX);

  // For real sessions: use the hook
  const {
    session,
    players,
    myPlayer,
    uiPhase,
    countdown,
    error,
    setReady,
    leave,
    sendMove,
    advanceRound,
    finishSession,
  } = useGameSession(isLocalSession ? 'dummy' : sessionId);

  // ── Local mode shim (solo / demo) ─────────────────────────────────────────
  const localPlayer = {
    userId: uid,
    username,
    avatarEmoji: '🎮',
    score: 0,
    roundsWon: 0,
    isReady: true,
    isHost: true,
    isOnline: true,
    joinedAt: null,
  };

  const displayPlayers = isLocalSession ? [localPlayer] : players;
  const displayPhase = isLocalSession ? 'playing' : uiPhase;
  const effectiveMyPlayer = isLocalSession ? localPlayer : myPlayer;

  // ── Finish handler ────────────────────────────────────────────────────────
  const handleGameFinish = async (scores: Record<string, number>) => {
    if (!isLocalSession) {
      const winnerId = Object.entries(scores).sort(([, a], [, b]) => b - a)[0]?.[0];
      await finishSession(winnerId);
    }
  };

  const handleLeave = async () => {
    if (!isLocalSession) await leave();
    navigation.goBack();
  };

  // ── Render game engine ────────────────────────────────────────────────────
  const renderGame = () => {
    const gameProps = {
      players: displayPlayers,
      myUserId: uid,
      onFinish: handleGameFinish,
      onSendMove: isLocalSession ? undefined : sendMove,
    };

    switch (gameSlug) {
      case 'trivia':
        return <TriviaGame {...gameProps} />;
      case 'rock_paper_scissors':
        return <RockPaperScissorsGame {...gameProps} />;
      case 'dice':
        return <DiceGame {...gameProps} />;
      case 'bingo':
        return <BingoGame {...gameProps} />;
      case 'draw_guess':
        return <DrawGuessPlaceholder onBack={handleLeave} />;
      case 'ludo':
      case 'domino':
        return <LudoPlaceholder onBack={handleLeave} />;
      default:
        return (
          <View style={styles.unknownGame}>
            <Text style={styles.unknownText}>Juego no disponible: {gameSlug}</Text>
            <TouchableOpacity onPress={handleLeave}>
              <Text style={styles.unknownLink}>Volver</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleLeave} style={styles.leaveBtn}>
          <Text style={styles.leaveIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>{gameTitle ?? gameSlug}</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Error state */}
      {!isLocalSession && error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Loading */}
      {!isLocalSession && displayPhase === 'loading' && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando sesión...</Text>
        </View>
      )}

      {/* Lobby */}
      {displayPhase === 'lobby' && session && (
        <GameSessionLobby
          session={session}
          players={displayPlayers}
          myUserId={uid}
          minPlayers={session.minPlayers}
          maxPlayers={session.maxPlayers}
          isHost={session.hostId === uid}
          onReady={setReady}
          onLeave={handleLeave}
          myPlayer={effectiveMyPlayer}
        />
      )}

      {/* Countdown */}
      {displayPhase === 'countdown' && <CountdownOverlay count={countdown} />}

      {/* Game playing */}
      {(displayPhase === 'playing' || isLocalSession) && (
        <View style={styles.gameArea}>{renderGame()}</View>
      )}

      {/* Finished placeholder (result is shown by game engine) */}
      {displayPhase === 'finished' && !isLocalSession && (
        <View style={styles.finishedPlaceholder}>
          <Text style={styles.finishedText}>Partida finalizada</Text>
          <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.exitBtnText}>Volver al catálogo</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leaveBtn: { padding: spacing.xs },
  leaveIcon: { fontSize: 18, color: colors.textMuted, fontWeight: '700' },
  topTitle: { ...textPresets.h3, color: colors.text },
  errorBanner: {
    backgroundColor: colors.error + '22',
    padding: spacing.md,
    borderRadius: 8,
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: { ...textPresets.caption, color: colors.error, textAlign: 'center' },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: { ...textPresets.bodyMedium, color: colors.textMuted },
  gameArea: { flex: 1 },
  unknownGame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  unknownText: { ...textPresets.bodyMedium, color: colors.textMuted },
  unknownLink: { color: colors.primary, fontWeight: '700' },
  finishedPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  finishedText: { ...textPresets.h2, color: colors.text },
  exitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
  },
  exitBtnText: { ...textPresets.bodyMedium, color: '#fff', fontWeight: '700' },
});
