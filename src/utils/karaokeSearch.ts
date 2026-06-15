import { KaraokeSong } from '../types/karaoke';
import { normalizeSearchText, buildSearchKeywords } from './searchNormalize';

/**
 * Normalizes text for Karaoke searches.
 */
export function normalizeKaraokeText(value: string): string {
  return normalizeSearchText(value);
}

/**
 * Builds array-contains keywords for a song.
 */
export function buildKaraokeSongKeywords(song: Partial<KaraokeSong>): string[] {
  const inputs: string[] = [];
  if (song.title) inputs.push(song.title);
  if (song.artist) inputs.push(song.artist);
  if (song.genre) inputs.push(song.genre);
  if (song.tags && song.tags.length > 0) {
    inputs.push(...song.tags);
  }
  return buildSearchKeywords(inputs);
}

/**
 * Filters a list of KaraokeSongs in memory.
 */
export function filterKaraokeSongs(
  songs: KaraokeSong[],
  query: string,
  language?: string,
  genre?: string
): KaraokeSong[] {
  const normQuery = normalizeKaraokeText(query);
  return songs.filter(song => {
    if (language && song.language !== language) return false;
    if (genre && song.genre !== genre) return false;

    if (normQuery) {
      const normTitle = normalizeKaraokeText(song.title || '');
      const normArtist = normalizeKaraokeText(song.artist || '');
      const hasQuery = normTitle.includes(normQuery) || normArtist.includes(normQuery);
      if (!hasQuery) return false;
    }
    return true;
  });
}
