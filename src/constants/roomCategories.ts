export type RoomCategoryType =
  | 'music'
  | 'karaoke'
  | 'party'
  | 'games'
  | 'talk'
  | 'talents'
  | 'christian'
  | 'podcast'
  | 'debate'
  | 'friends'
  | 'private'
  | 'vip';

export interface RoomCategory {
  id: RoomCategoryType;
  label: string;
  iconEmoji: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export const ROOM_CATEGORIES: RoomCategory[] = [
  {
    id: 'music',
    label: 'Música',
    iconEmoji: '🎵',
    description: 'Comparte y escucha canciones favoritas',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'karaoke',
    label: 'Karaoke',
    iconEmoji: '🎤',
    description: '¡Sube a cantar con tus amigos!',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'party',
    label: 'Fiesta',
    iconEmoji: '🥳',
    description: 'Eventos especiales y diversión grupal',
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'games',
    label: 'Juegos',
    iconEmoji: '🎮',
    description: 'Coordina partidas y juega casuales',
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'talk',
    label: 'Conversación',
    iconEmoji: '💬',
    description: 'Charla relajada sobre cualquier tema',
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'talents',
    label: 'Talentos',
    iconEmoji: '🌟',
    description: 'Muestra tus habilidades especiales',
    isActive: true,
    sortOrder: 6,
  },
  {
    id: 'christian',
    label: 'Cristiana',
    iconEmoji: '⛪',
    description: 'Reuniones de fe y cantos cristianos',
    isActive: true,
    sortOrder: 7,
  },
  {
    id: 'podcast',
    label: 'Podcast',
    iconEmoji: '🎙️',
    description: 'Charlas estructuradas y programas en vivo',
    isActive: true,
    sortOrder: 8,
  },
  {
    id: 'debate',
    label: 'Debate',
    iconEmoji: '⚖️',
    description: 'Discute diferentes puntos de vista respetuosamente',
    isActive: true,
    sortOrder: 9,
  },
  {
    id: 'friends',
    label: 'Amigos',
    iconEmoji: '👥',
    description: 'Salas públicas para conocer gente nueva',
    isActive: true,
    sortOrder: 10,
  },
  {
    id: 'private',
    label: 'Privada',
    iconEmoji: '🔒',
    description: 'Solo personas autorizadas por el creador',
    isActive: true,
    sortOrder: 11,
  },
  {
    id: 'vip',
    label: 'VIP',
    iconEmoji: '👑',
    description: 'Salas VIP con privilegios especiales',
    isActive: true,
    sortOrder: 12,
  },
];
