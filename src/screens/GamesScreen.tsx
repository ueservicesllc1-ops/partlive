import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors, spacing, textPresets } from '../theme';
import { MainHeader } from '../components/navigation/MainHeader';
import { GameCard } from '../components/games/GameCard';
import { MAIN_ROUTES } from '../app/routes';
import { useGamesList } from '../hooks/useGamesList';
import { Game, GameCardData } from '../types/game';

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = ['Todos', 'Trivia', 'Acción', 'Casual', 'Social'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toCardData = (g: Game): GameCardData => ({
  id: g.id,
  slug: g.slug,
  title: g.title,
  description: g.description,
  icon: g.icon,
  color: g.color,
  status: g.status,
  playersOnline: g.playersOnline ?? 0,
  estimatedMinutes: g.estimatedMinutes,
});

// ─── Fallback mock (when Firestore is empty / loading) ────────────────────────
const MOCK_ACTIVE: GameCardData[] = [
  { id: 'trivia', slug: 'trivia', title: 'Trivia Live', description: 'Responde rápido y demuestra cuánto sabes.', icon: '💡', color: '#8A4FFF', status: 'active', playersOnline: 4200, estimatedMinutes: 5 },
  { id: 'rps', slug: 'rock_paper_scissors', title: 'Piedra, Papel o Tijeras', description: 'El clásico duelo de 3 rondas contra otros jugadores.', icon: '✂️', color: '#00E5FF', status: 'active', playersOnline: 2800, estimatedMinutes: 3 },
  { id: 'dice', slug: 'dice', title: 'Dados Locos', description: 'Lanza dados y el mayor puntaje gana. ¡Pura suerte!', icon: '🎲', color: '#FF3366', status: 'active', playersOnline: 3100, estimatedMinutes: 4 },
  { id: 'bingo', slug: 'bingo', title: 'Bingo Loco', description: '¡Canta Bingo antes que nadie y gana monedas!', icon: '🔢', color: '#00E676', status: 'active', playersOnline: 6700, estimatedMinutes: 8 },
];

const MOCK_COMING: GameCardData[] = [
  { id: 'draw', slug: 'draw_guess', title: 'Draw & Guess', description: 'Dibuja rápido y adivina el dibujo de los demás.', icon: '🎨', color: '#FFC400', status: 'coming_soon', playersOnline: 0, estimatedMinutes: 10 },
  { id: 'ludo', slug: 'ludo', title: 'Ludo Party', description: 'El clásico ludo con amigos en tiempo real.', icon: '🎯', color: '#FF5722', status: 'coming_soon', playersOnline: 0, estimatedMinutes: 20 },
  { id: 'domino', slug: 'domino', title: 'Dominó Pro', description: 'Bloquea a tus oponentes y domina la mesa.', icon: '🀄', color: '#9C27B0', status: 'coming_soon', playersOnline: 0, estimatedMinutes: 15 },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const GamesScreen = ({ navigation }: any) => {
  const { filteredGames, loading, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, refresh } = useGamesList();
  const [localCategory, setLocalCategory] = useState('Todos');

  const activeGames: GameCardData[] =
    filteredGames.length > 0 ? filteredGames.map(toCardData) : MOCK_ACTIVE;

  const handleGamePress = (game: GameCardData) => {
    navigation.navigate(MAIN_ROUTES.GAME_DETAILS, { gameId: game.id });
  };

  const handleCategorySelect = (cat: string) => {
    setLocalCategory(cat);
    setSelectedCategory(cat === 'Todos' ? null : cat);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <MainHeader
        title="Juegos"
        onSearchPress={() => navigation.navigate(MAIN_ROUTES.SEARCH)}
        onNotificationsPress={() => navigation.navigate(MAIN_ROUTES.NOTIFICATIONS)}
        onWalletPress={() => navigation.navigate(MAIN_ROUTES.WALLET)}
        onMessagesPress={() => navigation.navigate(MAIN_ROUTES.PRIVATE_CONVERSATIONS)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search bar */}
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar juego..."
            placeholderTextColor={colors.textDark}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, localCategory === cat && styles.catChipActive]}
              onPress={() => handleCategorySelect(cat)}
            >
              <Text
                style={[styles.catText, localCategory === cat && styles.catTextActive]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Active games section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎮 Juegos Activos</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>En vivo</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />
        ) : (
          <View style={styles.grid}>
            {activeGames.map(game => (
              <GameCard key={game.id} game={game} onPress={() => handleGamePress(game)} />
            ))}
          </View>
        )}

        {/* Coming soon section */}
        <Text style={styles.sectionTitle}>🔒 Próximamente</Text>
        <View style={styles.grid}>
          {MOCK_COMING.map(game => (
            <GameCard key={game.id} game={game} onPress={() => {}} />
          ))}
        </View>

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, gap: spacing.lg },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    ...textPresets.bodyMedium,
    color: colors.text,
    paddingVertical: 0,
  },
  categoryRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  catTextActive: { color: '#fff' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: { ...textPresets.h3, color: colors.text, flex: 1 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary + '22',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondary },
  liveText: { fontSize: 9, color: colors.secondary, fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
