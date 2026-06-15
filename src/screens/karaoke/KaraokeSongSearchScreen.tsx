import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { useKaraokeSongs } from '../../hooks/useKaraokeSongs';
import { useKaraokeSession } from '../../hooks/useKaraokeSession';
import { KaraokeSongCard } from '../../components/karaoke/KaraokeSongCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../app/navigationTypes';

type Props = NativeStackScreenProps<MainStackParamList, 'KaraokeSongSearch'>;

const GENRES = ['Todos', 'Pop', 'Rock', 'Latin', 'Gospel', 'Traditional'];
const LANGUAGES = [
  { label: 'Todos', value: '' },
  { label: 'Español', value: 'es' },
  { label: 'Inglés', value: 'en' },
];

export const KaraokeSongSearchScreen: React.FC<Props> = ({ route, navigation }) => {
  const { targetType, targetId } = route.params;

  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [selectedLang, setSelectedLang] = useState('');

  const { songs, loading, toggleFavorite, isFavorite, searchSongs } = useKaraokeSongs();
  const { requestToSing, queue } = useKaraokeSession(targetType, targetId);

  useEffect(() => {
    const genreFilter = selectedGenre === 'Todos' ? undefined : selectedGenre;
    const langFilter = selectedLang === '' ? undefined : selectedLang;
    searchSongs({ query, genre: genreFilter, language: langFilter });
  }, [query, selectedGenre, selectedLang, searchSongs]);

  const handleRequestSing = async (songId: string) => {
    await requestToSing(songId);
  };

  const isSongInQueue = (songId: string) => {
    return queue.some(item => item.songId === songId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.text }}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catálogo de Karaoke 🎵</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar título o artista..."
          placeholderTextColor={colors.textDark}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={{ fontSize: 16 }}>❌</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters (Genre Scroll) */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreScroll}>
          {GENRES.map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <TouchableOpacity
                key={genre}
                style={[styles.genreTab, isSelected && styles.genreTabActive]}
                onPress={() => setSelectedGenre(genre)}
              >
                <Text style={[styles.genreText, isSelected && styles.genreTextActive]}>{genre}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Language filter buttons */}
      <View style={styles.langFilters}>
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLang === lang.value;
          return (
            <TouchableOpacity
              key={lang.label}
              style={[styles.langTab, isSelected && styles.langTabActive]}
              onPress={() => setSelectedLang(lang.value)}
            >
              <Text style={[styles.langText, isSelected && styles.langTextActive]}>{lang.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Songs List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : songs.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 32 }}>🎵</Text>
          <Text style={styles.emptyText}>No se encontraron canciones</Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <KaraokeSongCard
              song={item}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={() => toggleFavorite(item.id)}
              onRequestSing={() => handleRequestSing(item.id)}
              isRequested={isSongInQueue(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterContainer: {
    marginBottom: 8,
  },
  genreScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  genreTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genreTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genreText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  genreTextActive: {
    color: colors.text,
  },
  langFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  langTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  langTabActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  langText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  langTextActive: {
    color: colors.accent,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
