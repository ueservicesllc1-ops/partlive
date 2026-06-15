import { useState, useEffect, useCallback } from 'react';
import { Game } from '../types/game';
import { listenToActiveGames, getComingSoonGames } from '../services/firebase/firestore/gamesService';

interface UseGamesListResult {
  activeGames: Game[];
  comingSoon: Game[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  filteredGames: Game[];
  refresh: () => void;
}

export const useGamesList = (): UseGamesListResult => {
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [comingSoon, setComingSoon] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToActiveGames(
      games => {
        setActiveGames(games);
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [refreshKey]);

  useEffect(() => {
    getComingSoonGames()
      .then(setComingSoon)
      .catch(() => {});
  }, [refreshKey]);

  const filteredGames = activeGames.filter(game => {
    const matchesSearch =
      !searchQuery ||
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || game.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  return {
    activeGames,
    comingSoon,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredGames,
    refresh,
  };
};
