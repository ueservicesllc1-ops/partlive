import { useState, useEffect, useCallback } from 'react';
import { withFallbackData } from '../utils/homeDataFallback';
import { 
  mockBanners, mockRooms, mockLives, mockGames, 
  mockRankings, mockEvents, mockHosts, mockMissions 
} from '../constants/mockData';

export const useHomeData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [banners, setBanners] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [lives, setLives] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [hosts, setHosts] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      // Future: Promise.all([ roomsService.getPopularRooms(), ... ])
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Fetch remote data (null for now to trigger fallback)
      const remoteBanners = null;
      const remoteRooms = null;
      
      let remoteLives = null;
      try {
        const { getLiveStreams } = await import('../services/firebase/firestore/livesService');
        const activeLives = await getLiveStreams();
        if (activeLives && activeLives.length > 0) {
          remoteLives = activeLives.map(live => ({
            id: live.id,
            hostId: live.hostId,
            hostName: live.hostName,
            hostAvatar: live.hostPhotoURL || '👤',
            title: live.title,
            viewerCount: live.viewersCount || 0,
            coverImage: '',
            tags: live.tags || [],
          }));
        }
      } catch (e) {
        console.error('Error loading live streams for home page:', e);
      }

      const remoteGames = null;
      const remoteRankings = null;
      const remoteEvents = null;
      const remoteHosts = null;
      const remoteMissions = null;

      // Apply fallbacks
      setBanners(withFallbackData(remoteBanners, mockBanners));
      setRooms(withFallbackData(remoteRooms, mockRooms));
      setLives(withFallbackData(remoteLives, mockLives));
      setGames(withFallbackData(remoteGames, mockGames));
      setRankings(withFallbackData(remoteRankings, mockRankings));
      setEvents(withFallbackData(remoteEvents, mockEvents));
      setHosts(withFallbackData(remoteHosts, mockHosts));
      setMissions(withFallbackData(remoteMissions, mockMissions));

      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  return {
    loading,
    refreshing,
    error,
    banners,
    rooms,
    lives,
    games,
    rankings,
    events,
    hosts,
    missions,
    refresh,
  };
};
