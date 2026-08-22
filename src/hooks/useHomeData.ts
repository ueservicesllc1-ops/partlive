import { useState, useEffect, useCallback } from 'react';
import { withFallbackData } from '../utils/homeDataFallback';
import {
  mockBanners, mockRooms, mockLives, mockGames,
  mockRankings, mockEvents, mockHosts, mockMissions,
} from '../constants/mockData';
import { Banner } from '../types/banner';
import { Room } from '../types/room';
import { LiveStream } from '../types/live';
import { RankingEntry } from '../types/ranking';
import { SpecialEvent } from '../types/event';
import { UserProfile } from '../types/user';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HomeGame {
  id: string;
  name: string;
  icon: string;
  description: string;
  playersOnline: number;
  color: string;
}

export interface HomeMission {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  reward: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useHomeData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [banners, setBanners] = useState<Banner[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lives, setLives] = useState<LiveStream[]>([]);
  const [games, setGames] = useState<HomeGame[]>([]);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [hosts, setHosts] = useState<UserProfile[]>([]);
  const [missions, setMissions] = useState<HomeMission[]>([]);

  const fetchData = async () => {
    try {
      // ─── 1. Banners reales (home_top placement) ──────────────────────────
      let remoteBanners: Banner[] | null = null;
      try {
        const { getActiveBannersByPlacement } = await import('../services/firebase/firestore/bannersService');
        const fetchedBanners = await getActiveBannersByPlacement('home_top');
        if (fetchedBanners && fetchedBanners.length > 0) {
          remoteBanners = fetchedBanners;
        }
      } catch (e) {
        console.warn('[useHomeData] Error al cargar banners:', e);
      }

      // ─── 2. Salas populares reales ───────────────────────────────────────
      let remoteRooms: Room[] | null = null;
      try {
        const { getPopularRooms } = await import('../services/firebase/firestore/roomsService');
        const fetchedRooms = await getPopularRooms();
        if (fetchedRooms) {
          remoteRooms = fetchedRooms;
        }
      } catch (e) {
        console.warn('[useHomeData] Error al cargar salas:', e);
      }

      // ─── 3. Transmisiones en vivo reales ─────────────────────────────────
      let remoteLives: LiveStream[] | null = null;
      try {
        const { getLiveStreams } = await import('../services/firebase/firestore/livesService');
        const activeLives = await getLiveStreams();
        if (activeLives) {
          remoteLives = activeLives;
        }
      } catch (e) {
        console.warn('[useHomeData] Error al cargar transmisiones en vivo:', e);
      }

      // ─── 4. Juegos activos reales desde Firestore ───────────────────────
      let remoteGames: HomeGame[] | null = null;
      try {
        const { getActiveGames } = await import('../services/firebase/firestore/gamesService');
        const fetchedGames = await getActiveGames();
        if (fetchedGames && fetchedGames.length > 0) {
          remoteGames = fetchedGames.map(g => ({
            id: g.id,
            name: g.title,
            icon: g.icon,
            description: g.description,
            playersOnline: g.playersOnline ?? 0,
            color: g.color,
          }));
        }
      } catch (e) {
        console.warn('[useHomeData] Error al cargar juegos:', e);
      }

      // ─── 5. Rankings reales (tipo: daily_hosts) ───────────────────────────
      let remoteRankings: RankingEntry[] | null = null;
      try {
        const { getRankingByType } = await import('../services/firebase/firestore/rankingsService');
        const fetchedRankings = await getRankingByType('daily_hosts', 'daily');
        if (fetchedRankings && fetchedRankings.length > 0) {
          remoteRankings = fetchedRankings;
        }
      } catch (e) {
        console.warn('[useHomeData] Error al cargar rankings:', e);
      }

      // ─── 6. Eventos activos reales ────────────────────────────────────────
      let remoteEvents: SpecialEvent[] | null = null;
      try {
        const { getActiveEvents } = await import('../services/firebase/firestore/eventsService');
        const fetchedEvents = await getActiveEvents();
        if (fetchedEvents && fetchedEvents.length > 0) {
          remoteEvents = fetchedEvents;
        }
      } catch (e) {
        console.warn('[useHomeData] Error al cargar eventos:', e);
      }

      // ─── 7. Hosts destacados reales ───────────────────────────────────────
      let remoteHosts: UserProfile[] | null = null;
      try {
        const { getFeaturedHosts } = await import('../services/firebase/firestore/usersService');
        const fetchedHosts = await getFeaturedHosts(8);
        if (fetchedHosts && fetchedHosts.length > 0) {
          remoteHosts = fetchedHosts;
        }
      } catch (e) {
        console.warn('[useHomeData] Error al cargar hosts destacados:', e);
      }

      // ─── 8. Misiones diarias reales ───────────────────────────────────────
      const remoteMissions: HomeMission[] | null = null;

      // ─── Aplicar fallbacks a mock si no hay datos reales ─────────────────
      setBanners(withFallbackData(remoteBanners, mockBanners) as Banner[]);
      setRooms(withFallbackData(remoteRooms, mockRooms) as Room[]);
      setLives(withFallbackData(remoteLives, mockLives) as LiveStream[]);
      setGames(withFallbackData(remoteGames, mockGames) as HomeGame[]);
      setRankings(withFallbackData(remoteRankings, mockRankings) as RankingEntry[]);
      setEvents(withFallbackData(remoteEvents, mockEvents) as SpecialEvent[]);
      setHosts(withFallbackData(remoteHosts, mockHosts) as UserProfile[]);
      setMissions(withFallbackData(remoteMissions, mockMissions) as HomeMission[]);

      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar los datos';
      setError(message);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
