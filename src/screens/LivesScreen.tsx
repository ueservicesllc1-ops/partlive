import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { colors, spacing, textPresets } from '../theme';
import { LiveCard } from '../components/lives/LiveCard';
import { MainHeader } from '../components/navigation/MainHeader';
import { MAIN_ROUTES } from '../app/routes';
import { useLivesList } from '../hooks/useLivesList';

const CATEGORIES = ['Popular', 'Música', 'Fiesta', 'Juegos', 'Conversación', 'Talento'];

export const LivesScreen = ({ navigation }: any) => {
  const {
    lives,
    loading,
    refreshing,
    selectedCategory,
    searchQuery,
    refresh,
    setCategory,
    setSearchQuery,
  } = useLivesList();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <MainHeader 
        title="Live Streams"
        onSearchPress={() => navigation.navigate(MAIN_ROUTES.SEARCH)}
        onNotificationsPress={() => navigation.navigate(MAIN_ROUTES.NOTIFICATIONS)}
        onWalletPress={() => navigation.navigate(MAIN_ROUTES.WALLET)}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar lives, tags o hosts..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[styles.categoryBadge, isSelected && styles.categoryBadgeActive]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Live Streams List */}
      <FlatList
        data={lives}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={refresh} 
            tintColor={colors.accent} 
          />
        }
        renderItem={({ item }) => (
          <LiveCard
            item={item}
            onPress={() => navigation.navigate(MAIN_ROUTES.LIVE_DETAILS, { liveId: item.id })}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📺</Text>
              <Text style={styles.emptyText}>No hay lives activos en este momento.</Text>
            </View>
          ) : null
        }
      />

      {/* Floating Action Button "Iniciar live" */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate(MAIN_ROUTES.START_LIVE)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>➕</Text>
        <Text style={styles.fabText}>Iniciar live</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  searchInput: {
    backgroundColor: '#1E1B30',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#292440',
    color: '#FFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
  },
  categoriesWrapper: {
    height: 48,
    marginBottom: spacing.sm,
  },
  categoriesList: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E1B30',
    borderWidth: 1,
    borderColor: '#292440',
  },
  categoryBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: spacing.xs,
    paddingBottom: 100, // space for FAB
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  fabText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
export default LivesScreen;
