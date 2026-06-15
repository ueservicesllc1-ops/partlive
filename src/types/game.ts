// ─── Game Types ─────────────────────────────────────────────────────────────

export type GameType =
  | 'trivia'
  | 'rock_paper_scissors'
  | 'dice'
  | 'bingo'
  | 'draw_guess'
  | 'ludo'
  | 'domino';

export type GameStatus = 'active' | 'coming_soon' | 'disabled';

export type GameSessionStatus =
  | 'waiting'   // Lobby – esperando jugadores
  | 'ready'     // Todos listos, cuenta regresiva
  | 'playing'   // Partida en curso
  | 'finished'  // Partida terminada
  | 'cancelled'; // Cancelada (todos salieron)

export type GameSessionVisibility = 'public' | 'private' | 'friends_only';

export type GameInviteStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled';

// ─── Game (catálogo en Firestore) ────────────────────────────────────────────

export interface Game {
  id: string;
  slug: GameType;
  title: string;
  description: string;
  icon: string;            // emoji o URL de ícono
  color: string;           // color de acento de la tarjeta
  thumbnailUrl?: string;
  category: string;
  status: GameStatus;
  minPlayers: number;
  maxPlayers: number;
  estimatedMinutes: number; // duración estimada en minutos
  rewardCoinsMin: number;   // monedas mínimas al ganar
  rewardCoinsMax: number;   // monedas máximas al ganar
  rewardXp: number;         // XP por participar (ganador o no)
  playersOnline?: number;   // conteo aproximado de jugadores activos
  isActive: boolean;        // alias de status === 'active'
  createdAt: any;
  updatedAt: any;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export interface GameSession {
  id: string;
  gameId: string;
  gameSlug: GameType;
  hostId: string;
  status: GameSessionStatus;
  currentRound: number;
  totalRounds: number;
  maxPlayers: number;
  minPlayers: number;
  playerCount: number;
  visibility: GameSessionVisibility;
  inviteCode?: string;
  invitedUserIds?: string[];
  region?: string;
  language?: string;
  skillLevel?: 'any' | 'beginner' | 'intermediate' | 'advanced';
  expiresAt?: any;
  matchmakingEnabled: boolean;
  roomId?: string;   // sala relacionada (si aplica)
  liveId?: string;   // live relacionado (si aplica)
  winnerId?: string;
  winnerIds?: string[];
  gameState: Record<string, any>; // estado serializable específico del juego
  createdAt: any;
  startedAt?: any;
  finishedAt?: any;
}

// ─── Invite ───────────────────────────────────────────────────────────────────

export interface GameInvite {
  id: string;
  sessionId: string;
  gameId: string;
  gameTitle: string;
  fromUserId: string;
  fromDisplayName: string;
  fromPhotoURL?: string;
  toUserId: string;
  toDisplayName?: string;
  status: GameInviteStatus;
  message?: string;
  expiresAt: any;
  createdAt: any;
  updatedAt: any;
  respondedAt?: any;
}

// ─── Matchmaking Request ──────────────────────────────────────────────────────

export interface MatchmakingRequest {
  id: string;
  userId: string;
  gameId: string;
  gameType: GameType;
  status: 'searching' | 'matched' | 'cancelled' | 'expired';
  preferredPlayers?: number;
  language?: string;
  region?: string;
  skillLevel?: 'any' | 'beginner' | 'intermediate' | 'advanced';
  matchedSessionId?: string;
  createdAt: any;
  updatedAt: any;
  expiresAt: any;
}

// ─── Player in Session ────────────────────────────────────────────────────────

export interface GamePlayer {
  userId: string;
  username: string;
  avatarUrl?: string;
  avatarEmoji?: string;
  score: number;
  roundsWon: number;
  isReady: boolean;
  isHost: boolean;
  isOnline: boolean;
  joinedAt: any;
}

// ─── Move ─────────────────────────────────────────────────────────────────────

export interface GameMove {
  id: string;
  sessionId: string;
  userId: string;
  round: number;
  moveType: string;   // Ej: 'answer', 'roll', 'pick', 'mark'
  payload: Record<string, any>; // Datos del movimiento
  isValid?: boolean;
  processedAt?: any;
  createdAt: any;
}

// ─── Reward ───────────────────────────────────────────────────────────────────

export interface GameReward {
  sessionId: string;
  userId: string;
  coinsEarned: number;
  xpEarned: number;
  isWinner: boolean;
  reason: string;
  grantedAt: any;
}

// ─── UI-only local types ──────────────────────────────────────────────────────

export interface GameCardData {
  id: string;
  slug: GameType;
  title: string;
  description: string;
  icon: string;
  color: string;
  status: GameStatus;
  playersOnline: number;
  estimatedMinutes: number;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
