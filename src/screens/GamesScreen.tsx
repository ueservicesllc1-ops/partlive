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
const CATEGORIES = ['Todos', '3D Reales', 'Trivia', 'Acción', 'Casual', 'Social'];

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

// ─── Built-in Active Games (Always available) ─────────────────────────────────
const BUILTIN_ACTIVE: GameCardData[] = [
  { id: 'billiards', slug: 'billiards', title: 'Billar 8 Ball 3D', description: 'Físicas reales, taco dinámico y partidas 1v1 estilo profesional.', icon: '🎱', color: '#106348', status: 'active', playersOnline: 5800, estimatedMinutes: 6 },
  { id: 'trivia', slug: 'trivia', title: 'Trivia Live', description: 'Responde rápido y demuestra cuánto sabes.', icon: '💡', color: '#8A4FFF', status: 'active', playersOnline: 4200, estimatedMinutes: 5 },
  { id: 'rps', slug: 'rock_paper_scissors', title: 'Piedra, Papel o Tijeras', description: 'El clásico duelo de 3 rondas contra otros jugadores.', icon: '✂️', color: '#00E5FF', status: 'active', playersOnline: 2800, estimatedMinutes: 3 },
  { id: 'dice', slug: 'dice', title: 'Dados Locos', description: 'Lanza dados y el mayor puntaje gana. ¡Pura suerte!', icon: '🎲', color: '#FF3366', status: 'active', playersOnline: 3100, estimatedMinutes: 4 },
  { id: 'bingo', slug: 'bingo', title: 'Bingo Loco', description: '¡Canta Bingo antes que nadie y gana monedas!', icon: '🔢', color: '#00E676', status: 'active', playersOnline: 6700, estimatedMinutes: 8 },
];

const MOCK_COMING: GameCardData[] = [
  { id: 'blackjack', slug: 'blackjack', title: 'Blackjack 3D Casino', description: 'Mesa de cartas realista, apuestas de monedas y crupier.', icon: '🃏', color: '#D4AF37', status: 'coming_soon', playersOnline: 0, estimatedMinutes: 5 },
  { id: 'parchis', slug: 'parchis', title: 'Parchís 3D Real', description: 'Tablero 3D, dados con físicas y partidas de 2 a 4 jugadores.', icon: '🎯', color: '#E53935', status: 'coming_soon', playersOnline: 0, estimatedMinutes: 15 },
  { id: 'draw', slug: 'draw_guess', title: 'Draw & Guess', description: 'Dibuja rápido y adivina el dibujo de los demás.', icon: '🎨', color: '#FFC400', status: 'coming_soon', playersOnline: 0, estimatedMinutes: 10 },
  { id: 'domino', slug: 'domino', title: 'Dominó Pro', description: 'Bloquea a tus oponentes y domina la mesa.', icon: '🀄', color: '#9C27B0', status: 'coming_soon', playersOnline: 0, estimatedMinutes: 15 },
];

// ─── Component ────────────────────────────────────────────────────────────────
export const GamesScreen = ({ navigation }: any) => {
  const { filteredGames, loading, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, refresh } = useGamesList();
  const [localCategory, setLocalCategory] = useState('Todos');

  // Merge built-in games with Firestore games so Billiards 3D is ALWAYS visible
  const gamesMap = new Map<string, GameCardData>();
  BUILTIN_ACTIVE.forEach(g => gamesMap.set(g.slug, g));
  filteredGames.forEach(g => {
    const card = toCardData(g);
    gamesMap.set(card.slug || card.id, card);
  });
  
  let allActive = Array.from(gamesMap.values());
  if (localCategory === '3D Reales') {
    allActive = allActive.filter(g => g.slug === 'billiards');
  } else if (localCategory !== 'Todos') {
    allActive = allActive.filter(g => {
      const matchCat = filteredGames.find(fg => fg.slug === g.slug);
      return matchCat?.category === localCategory;
    });
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    allActive = allActive.filter(g => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
  }

  const activeGames = allActive;

  const handleGamePress = (game: GameCardData) => {
    navigation.navigate(MAIN_ROUTES.GAME_DETAILS, {
      gameId: game.slug ?? game.id,
    });
  };

  const handleCategorySelect = (cat: string) => {
    setLocalCategory(cat);
    setSelectedCategory(cat === 'Todos' || cat === '3D Reales' ? null : cat);
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
        {/* Featured 3D Game Banner */}
        <TouchableOpacity
          style={styles.featuredBanner}
          activeOpacity={0.88}
          onPress={() => navigation.navigate(MAIN_ROUTES.GAME_DETAILS, { gameId: 'billiards' })}
        >
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>✨ NUEVO MOTOR 3D</Text>
          </View>
          <View style={styles.featuredContent}>
            <View style={styles.featuredLeft}>
              <Text style={styles.featuredTitle}>🎱 Billar 8 Ball 3D</Text>
              <Text style={styles.featuredDesc}>
                Físicas reales, sombras dinámicas y partidas de billar profesional en tiempo real.
              </Text>
              <View style={styles.featuredButton}>
                <Text style={styles.featuredButtonText}>¡JUGAR AHORA! ▶</Text>
              </View>
            </View>
            <View style={styles.featuredIconContainer}>
              <Text style={styles.featuredEmoji}>🎱</Text>
            </View>
          </View>
        </TouchableOpacity>

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
  featuredBanner: {
    backgroundColor: '#0c2419',
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#106348',
    overflow: 'hidden',
    shadowColor: '#106348',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#5ef2aa22',
    borderColor: '#5ef2aa',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  featuredBadgeText: {
    color: '#5ef2aa',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  featuredLeft: {
    flex: 1,
    gap: 4,
  },
  featuredTitle: {
    ...textPresets.h2,
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  featuredDesc: {
    ...textPresets.bodySmall,
    color: '#b2d8c7',
    fontSize: 11,
    lineHeight: 15,
  },
  featuredButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#106348',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 6,
  },
  featuredButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuredIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featuredEmoji: {
    fontSize: 34,
  },
});
