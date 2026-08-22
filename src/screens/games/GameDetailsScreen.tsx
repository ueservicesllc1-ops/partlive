import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { colors, textPresets, spacing } from '../../theme';
import { Game, GameSession } from '../../types/game';
import { getGameById } from '../../services/firebase/firestore/gamesService';
import {
  createGameSession,
  createPublicSession,
  createPrivateSession,
  joinSessionByInviteCode,
  getPublicWaitingSessions,
  joinGameSession,
} from '../../services/firebase/firestore/gameSessionsService';
import { MAIN_ROUTES } from '../../app/routes';
import { GameRulesCard } from '../../components/games/GameRulesCard';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { JoinByCodeModal } from '../../components/games/JoinByCodeModal';
import { AvailableSessionsList } from '../../components/games/AvailableSessionsList';

// ─── Rules per game type ──────────────────────────────────────────────────────
const GAME_RULES: Record<string, { icon: string; text: string }[]> = {
  billiards: [
    { icon: '🎱', text: 'Juego clásico 8 Ball Pool en 3D con físicas reales.' },
    { icon: '🎯', text: 'Apunta con el dedo o los botones y gradúa la fuerza del taco.' },
    { icon: '⚪', text: 'Emboca tus bolas (sólidas o rayadas) y finaliza con la bola 8.' },
    { icon: '🪙', text: 'Gana 100 monedas por partida ganada.' },
  ],
  blackjack: [
    { icon: '🃏', text: 'Llega a 21 o acércate más que el crupier sin pasarte.' },
    { icon: '💰', text: 'Apuesta fichas/monedas virtuales antes de cada mano.' },
    { icon: '✌️', text: 'Opciones de Pedir (Hit), Plantarse (Stand) o Doblar (Double).' },
    { icon: '🔒', text: 'Próximamente disponible.' },
  ],
  parchis: [
    { icon: '🎲', text: 'Mueve tus 4 fichas desde la casa hasta la meta.' },
    { icon: '⚔️', text: 'Come las fichas de tus oponentes para enviarlas a su casa.' },
    { icon: '🛡️', text: 'Crea barreras en las casillas seguras para bloquear el paso.' },
    { icon: '🔒', text: 'Próximamente disponible.' },
  ],
  trivia: [
    { icon: '💡', text: '5 preguntas de cultura general, ciencia, música y más.' },
    { icon: '⏱️', text: '15 segundos para responder cada pregunta.' },
    { icon: '🚀', text: 'Responder rápido da puntos extra (bonus de velocidad).' },
    { icon: '🪙', text: 'Gana 80 monedas si eres el primer lugar.' },
  ],
  rock_paper_scissors: [
    { icon: '✂️', text: '3 rondas de Piedra, Papel o Tijeras.' },
    { icon: '🤖', text: 'Juega contra la CPU o espera a un oponente real.' },
    { icon: '🏆', text: 'Gana 2 de 3 rondas para ser el campeón.' },
    { icon: '🪙', text: 'El ganador recibe 60 monedas.' },
  ],
  dice: [
    { icon: '🎲', text: '3 rondas de lanzamiento de dados.' },
    { icon: '🔢', text: 'El número más alto gana cada ronda.' },
    { icon: '🤝', text: 'En empate se reparten puntos.' },
    { icon: '🪙', text: 'El ganador recibe 50 monedas.' },
  ],
  bingo: [
    { icon: '🔢', text: 'Cartón 3x3 con espacio libre en el centro.' },
    { icon: '🎤', text: 'Los números se cantan automáticamente cada 3 segundos.' },
    { icon: '✅', text: 'Completa fila, columna o diagonal para cantar Bingo.' },
    { icon: '🪙', text: 'El primer Bingo gana 120 monedas.' },
  ],
  draw_guess: [
    { icon: '🖊️', text: 'Un jugador dibuja, los demás adivinan.' },
    { icon: '⏱️', text: 'Tienes 60 segundos para dibujar cada palabra.' },
    { icon: '💬', text: 'Adivina antes para ganar más puntos.' },
    { icon: '🔒', text: 'Próximamente disponible.' },
  ],
};

// ─── Emoji / color fallback (for mock) ───────────────────────────────────────
const GAME_META: Record<string, { icon: string; color: string; emoji: string; estimatedMinutes: number }> = {
  billiards: { icon: '🎱', color: '#106348', emoji: '🎱', estimatedMinutes: 6 },
  blackjack: { icon: '🃏', color: '#D4AF37', emoji: '🃏', estimatedMinutes: 5 },
  parchis: { icon: '🎯', color: '#E53935', emoji: '🎲', estimatedMinutes: 15 },
  trivia: { icon: '💡', color: '#8A4FFF', emoji: '🧠', estimatedMinutes: 5 },
  rock_paper_scissors: { icon: '✂️', color: '#00E5FF', emoji: '🪨📄✂️', estimatedMinutes: 3 },
  dice: { icon: '🎲', color: '#FF3366', emoji: '🎲', estimatedMinutes: 4 },
  bingo: { icon: '🔢', color: '#00E676', emoji: '🎯', estimatedMinutes: 8 },
  draw_guess: { icon: '🎨', color: '#FFC400', emoji: '🖼️', estimatedMinutes: 10 },
  ludo: { icon: '🎯', color: '#FF5722', emoji: '🎯', estimatedMinutes: 20 },
  domino: { icon: '🀄', color: '#9C27B0', emoji: '🀄', estimatedMinutes: 15 },
};

// ─── Human-readable title map (fallback when Firestore is empty) ──────────────
const GAME_TITLE_MAP: Record<string, string> = {
  billiards: 'Billar 8 Ball 3D',
  blackjack: 'Blackjack 3D Casino',
  parchis: 'Parchís 3D Real',
  trivia: 'Trivia Live',
  rock_paper_scissors: 'Piedra, Papel o Tijeras',
  dice: 'Dados Locos',
  bingo: 'Bingo Loco',
  draw_guess: 'Draw & Guess',
  ludo: 'Ludo Party',
  domino: 'Dominó Pro',
};

export const GameDetailsScreen = ({ route, navigation }: any) => {
  const { gameId } = route.params || {};
  const currentUser = auth().currentUser;

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Matchmaking & Invite Code States
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [showAvailableList, setShowAvailableList] = useState(false);
  const [publicSessions, setPublicSessions] = useState<GameSession[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);

  const { quickMatch, searching } = useMatchmaking();

  useEffect(() => {
    loadGame();
  }, [gameId]);

  const loadGame = async () => {
    setLoading(true);
    try {
      const g = await getGameById(gameId);
      setGame(g);
    } catch (e) {
      console.error('Failed to load game info:', e);
    } finally {
      setLoading(false);
    }
  };

  // Resolved values used across all play actions (safe even if Firestore game is null)
  const resolvedSlug = game?.slug ?? gameId;
  const resolvedTitle = game?.title ?? GAME_TITLE_MAP[gameId] ?? gameId.replace(/_/g, ' ');

  const handleQuickMatch = async () => {
    if (!currentUser) return;
    try {
      // If game loaded from Firestore use it; otherwise build a minimal game object
      const gameForMatch = game ?? {
        id: gameId,
        slug: resolvedSlug,
        title: resolvedTitle,
        minPlayers: 1,
        maxPlayers: 4,
        status: 'active' as const,
        playersOnline: 0,
        estimatedMinutes: GAME_META[gameId]?.estimatedMinutes ?? 5,
        icon: GAME_META[gameId]?.icon ?? '🎮',
        color: GAME_META[gameId]?.color ?? '#8A4FFF',
        description: '',
        category: '',
        rewardCoinsMin: 10,
        rewardCoinsMax: 120,
        rewardXp: 50,
        isActive: true,
        createdAt: null as any,
        updatedAt: null as any,
      };
      const sessionId = await quickMatch(gameForMatch);
      navigation.navigate(MAIN_ROUTES.GAME_SESSION, {
        sessionId,
        gameSlug: resolvedSlug,
        gameTitle: resolvedTitle,
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se encontró partida rápida.');
    }
  };

  const handleCreatePublic = async () => {
    if (!currentUser) return;
    setCreating(true);
    try {
      const hostProfile = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Usuario',
        photoURL: currentUser.photoURL || null,
      };
      const gameForSession = game ?? {
        id: gameId,
        slug: resolvedSlug,
        title: resolvedTitle,
        minPlayers: 1,
        maxPlayers: 4,
        status: 'active' as const,
        playersOnline: 0,
        estimatedMinutes: GAME_META[gameId]?.estimatedMinutes ?? 5,
        icon: GAME_META[gameId]?.icon ?? '🎮',
        color: GAME_META[gameId]?.color ?? '#8A4FFF',
        description: '',
        category: '',
        rewardCoinsMin: 10,
        rewardCoinsMax: 120,
        rewardXp: 50,
        isActive: true,
        createdAt: null as any,
        updatedAt: null as any,
      };
      const session = await createPublicSession(gameForSession, hostProfile);
      navigation.navigate(MAIN_ROUTES.GAME_SESSION, {
        sessionId: session.id,
        gameSlug: resolvedSlug,
        gameTitle: resolvedTitle,
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al crear la partida pública.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreatePrivate = async () => {
    if (!currentUser) return;
    setCreating(true);
    try {
      const hostProfile = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Usuario',
        photoURL: currentUser.photoURL || null,
      };
      const gameForSession = game ?? {
        id: gameId,
        slug: resolvedSlug,
        title: resolvedTitle,
        minPlayers: 1,
        maxPlayers: 4,
        status: 'active' as const,
        playersOnline: 0,
        estimatedMinutes: GAME_META[gameId]?.estimatedMinutes ?? 5,
        icon: GAME_META[gameId]?.icon ?? '🎮',
        color: GAME_META[gameId]?.color ?? '#8A4FFF',
        description: '',
        category: '',
        rewardCoinsMin: 10,
        rewardCoinsMax: 120,
        rewardXp: 50,
        isActive: true,
        createdAt: null as any,
        updatedAt: null as any,
      };
      const session = await createPrivateSession(gameForSession, hostProfile);
      navigation.navigate(MAIN_ROUTES.GAME_SESSION, {
        sessionId: session.id,
        gameSlug: resolvedSlug,
        gameTitle: resolvedTitle,
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al crear la partida privada.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async (inviteCode: string) => {
    if (!currentUser) return;
    const userProfile = {
      uid: currentUser.uid,
      displayName: currentUser.displayName || 'Usuario',
    };
    const sessionId = await joinSessionByInviteCode(inviteCode, userProfile);
    navigation.navigate(MAIN_ROUTES.GAME_SESSION, {
      sessionId,
      gameSlug: game?.slug || gameId,
      gameTitle: game?.title || gameId,
    });
  };

  const handleFetchPublicSessions = async () => {
    if (!game) return;
    setLoadingPublic(true);
    setShowAvailableList(true);
    try {
      const sessions = await getPublicWaitingSessions(game.id);
      setPublicSessions(sessions);
    } catch (e) {
      console.error('Error fetching public waiting sessions:', e);
    } finally {
      setLoadingPublic(false);
    }
  };

  const handleJoinFromList = async (session: GameSession) => {
    if (!currentUser) return;
    try {
      await joinGameSession(session.id, {
        userId: currentUser.uid,
        username: currentUser.displayName || `User_${currentUser.uid.slice(0, 4)}`,
        avatarEmoji: '🎮',
        isHost: false,
        isOnline: true,
      });
      const joinSlug = session.gameSlug ?? resolvedSlug;
      navigation.navigate(MAIN_ROUTES.GAME_SESSION, {
        sessionId: session.id,
        gameSlug: joinSlug,
        gameTitle: GAME_TITLE_MAP[joinSlug] ?? joinSlug.replace(/_/g, ' '),
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo unir a la partida.');
    }
  };

  // Determine display values
  const meta = GAME_META[gameId] ?? GAME_META['trivia'];
  const displayTitle = game?.title ?? gameId.replace(/_/g, ' ');
  const displayColor = game?.color ?? meta.color;
  const displayIcon = game?.icon ?? meta.icon;
  const displayDesc = game?.description ?? 'Juega y gana monedas internas. Sin dinero real.';
  const displayMinutes = game?.estimatedMinutes ?? meta.estimatedMinutes;
  const rules = GAME_RULES[gameId] ?? GAME_RULES['trivia'];
  const isComingSoon = game?.status === 'coming_soon' || ['draw_guess', 'ludo', 'domino'].includes(gameId);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayTitle}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: displayColor + '33' }]}>
          <View style={[styles.bannerGlow, { backgroundColor: displayColor }]} />
          <Text style={styles.bannerIcon}>{displayIcon}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.gameTitle}>{displayTitle}</Text>
          <Text style={styles.gameDesc}>{displayDesc}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statText}>~{displayMinutes} min</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statText}>
                {game?.minPlayers ?? 1}-{game?.maxPlayers ?? 4} jugadores
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🪙</Text>
              <Text style={styles.statText}>
                {game?.rewardCoinsMin ?? 10}-{game?.rewardCoinsMax ?? 120} monedas
              </Text>
            </View>
          </View>
        </View>

        {/* Rules */}
        <GameRulesCard rules={rules} />

        {/* Matchmaking options */}
        {!isComingSoon && (
          <View style={styles.optionsContainer}>
            <Text style={styles.sectionTitle}>⚙️ Opciones de Sala</Text>
            
            <View style={styles.optionsGrid}>
              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleCreatePublic}
                disabled={creating}
              >
                <Text style={styles.optionIcon}>🌐</Text>
                <Text style={styles.optionTitle}>Crear Pública</Text>
                <Text style={styles.optionDesc}>Abierta para matchmaking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleCreatePrivate}
                disabled={creating}
              >
                <Text style={styles.optionIcon}>🔒</Text>
                <Text style={styles.optionTitle}>Crear Privada</Text>
                <Text style={styles.optionDesc}>Solo amigos con código</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.wideOptionBtn} onPress={() => setCodeModalVisible(true)}>
              <Text style={styles.wideOptionBtnText}>🔑 Unirse con Código</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.wideOptionBtn} onPress={handleFetchPublicSessions}>
              <Text style={styles.wideOptionBtnText}>👁️ Ver Partidas Disponibles</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Available sessions list section */}
        {!isComingSoon && showAvailableList && (
          <View style={styles.sessionsContainer}>
            <Text style={styles.sectionTitle}>🟢 Partidas Públicas Activas</Text>
            <AvailableSessionsList
              sessions={publicSessions}
              onJoinSession={handleJoinFromList}
              loading={loadingPublic}
            />
          </View>
        )}

        {loading && <ActivityIndicator color={colors.primary} />}
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        {isComingSoon ? (
          <View style={styles.comingSoonBar}>
            <Text style={styles.comingSoonBarText}>🔒 Próximamente disponible</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.playBtn,
              { backgroundColor: displayColor },
              (creating || searching) && styles.playBtnLoading,
            ]}
            onPress={handleQuickMatch}
            disabled={creating || searching}
            activeOpacity={0.85}
          >
            {creating || searching ? (
              <ActivityIndicator color="#0B0813" />
            ) : (
              <Text style={styles.playBtnText}>⚡ Partida Rápida</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Join by code modal */}
      <JoinByCodeModal
        visible={codeModalVisible}
        onClose={() => setCodeModalVisible(false)}
        onJoin={handleJoinByCode}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  backIcon: { fontSize: 24, color: colors.text },
  headerTitle: { ...textPresets.h3, color: colors.text },
  scrollContent: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 140 },
  banner: {
    height: 180,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.2,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -60 }],
  },
  bannerIcon: { fontSize: 80 },
  infoBox: { gap: spacing.sm },
  gameTitle: { ...textPresets.h2, color: colors.text },
  gameDesc: { ...textPresets.bodyMedium, color: colors.textMuted, lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', marginTop: spacing.xs },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statIcon: { fontSize: 12 },
  statText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  
  optionsContainer: { gap: spacing.md, marginTop: spacing.sm },
  sectionTitle: { ...textPresets.bodyMedium, color: colors.text, fontWeight: '700', marginBottom: spacing.xs },
  optionsGrid: { flexDirection: 'row', gap: spacing.md },
  optionCard: {
    flex: 1,
    backgroundColor: '#1E1935',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#2D274A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  optionIcon: { fontSize: 28, marginBottom: 4 },
  optionTitle: { ...textPresets.bodyMedium, color: colors.text, fontWeight: '700' },
  optionDesc: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  
  wideOptionBtn: {
    backgroundColor: '#2D274A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3D375E',
  },
  wideOptionBtnText: { ...textPresets.bodyMedium, color: colors.text, fontWeight: '700' },
  
  sessionsContainer: { gap: spacing.md, marginTop: spacing.sm },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  playBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  playBtnLoading: { opacity: 0.7 },
  playBtnText: { ...textPresets.h3, color: '#0B0813', fontWeight: '800' },
  comingSoonBar: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  comingSoonBarText: { ...textPresets.bodyMedium, color: colors.textDark, fontWeight: '700' },
});
