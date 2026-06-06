export const mockCurrentUser = {
  id: 'u1',
  username: 'Alex_PartyLive',
  avatar: '🛸', // Using fun emojis as placeholder avatars that render beautiful on all platforms
  level: 15,
  coins: 4850,
  followers: 1240,
  following: 382,
  bio: 'Amo la música y hacer nuevos amigos. ¡Hablemos en mis salas! 🎧🔥',
};

export const mockRooms = [
  {
    id: 'r1',
    title: '🎧 Chill & Music 24/7 - ¡Ven a charlar!',
    hostName: 'DJ_Luna',
    hostAvatar: '👩‍🎤',
    category: 'Música',
    onlineUsersCount: 42,
    maxUsersCount: 100,
    tags: ['Relax', 'Pop', 'DJ'],
  },
  {
    id: 'r2',
    title: '🏆 Torneo Ludo y Dominó - Sala Oficial',
    hostName: 'Carlos_King',
    hostAvatar: '👑',
    category: 'Juegos',
    onlineUsersCount: 88,
    maxUsersCount: 150,
    tags: ['Ludo', 'Torneo', 'Amigos'],
  },
  {
    id: 'r3',
    title: '🗣️ Debate Nocturno: ¿Pizza con piña?',
    hostName: 'Sofi_Debates',
    hostAvatar: '🍕',
    category: 'Chat',
    onlineUsersCount: 15,
    maxUsersCount: 50,
    tags: ['Charla', 'Humor', 'Social'],
  },
  {
    id: 'r4',
    title: '🎤 Karaoke Extremo - ¡Canta tu éxito!',
    hostName: 'Leo_Singer',
    hostAvatar: '🎙️',
    category: 'Canto',
    onlineUsersCount: 56,
    maxUsersCount: 100,
    tags: ['Canto', 'Karaoke', 'Español'],
  },
];

export const mockLives = [
  {
    id: 'l1',
    hostId: 'h1',
    hostName: 'GamerGirl_Vivi',
    hostAvatar: '👾',
    title: 'Subiendo de rango en vivo 🚀 - Apoya con regalos!',
    viewerCount: 1420,
    coverImage: '🎮',
    tags: ['Español', 'Gamer', 'Pro'],
  },
  {
    id: 'l2',
    hostId: 'h2',
    hostName: 'Dani_Acoustic',
    hostAvatar: '🎸',
    title: 'Concierto acústico íntimo 🎶 | Pide tu canción',
    viewerCount: 850,
    coverImage: '🎵',
    tags: ['Música', 'Guitarra', 'Chill'],
  },
  {
    id: 'l3',
    hostId: 'h3',
    hostName: 'Mati_Vlogs',
    hostAvatar: '🌟',
    title: 'Charlando un rato sobre el futuro de las redes',
    viewerCount: 620,
    coverImage: '☕',
    tags: ['Hablar', 'Amigos', 'Noche'],
  },
];

export const mockGames = [
  {
    id: 'g1',
    name: 'Ludo Party',
    icon: '🎲',
    description: 'El clásico ludo con amigos en tiempo real.',
    playersOnline: 12400,
    color: '#FF3366',
  },
  {
    id: 'g2',
    name: 'Dominó Pro',
    icon: '🀄',
    description: 'Bloquea a tus oponentes y domina la mesa.',
    playersOnline: 8500,
    color: '#00E5FF',
  },
  {
    id: 'g3',
    name: 'Trivia Live',
    icon: '💡',
    description: 'Responde rápido y demuestra cuánto sabes.',
    playersOnline: 4200,
    color: '#8A4FFF',
  },
  {
    id: 'g4',
    name: 'Draw & Guess',
    icon: '🎨',
    description: 'Dibuja rápido y adivina el dibujo de los demás.',
    playersOnline: 3100,
    color: '#FFC400',
  },
  {
    id: 'g5',
    name: 'Bingo Loco',
    icon: '🔢',
    description: '¡Canta Bingo antes que nadie y gana monedas!',
    playersOnline: 6700,
    color: '#00E676',
  },
  {
    id: 'g6',
    name: 'Karaoke Battle',
    icon: '🎤',
    description: 'Batalla de canto y votación popular.',
    playersOnline: 5100,
    color: '#FF1744',
  },
];

export const mockRankings = [
  { rank: 1, name: 'Princess_Mia', score: '150K xp', avatar: '👸', change: 'up' },
  { rank: 2, name: 'Gamer_Elian', score: '124K xp', avatar: '🧙', change: 'up' },
  { rank: 3, name: 'Luna_Sing', score: '98K xp', avatar: '🐱', change: 'down' },
];

export const mockBanners = [
  { id: 'b1', title: 'Fiesta de Regalos esta noche', actionType: 'event', actionValue: 'e1', color: '#6200EA' },
  { id: 'b2', title: 'Ranking Semanal de Hosts', actionType: 'url', actionValue: 'rankings', color: '#C51162' },
  { id: 'b3', title: 'Juega y Gana Monedas', actionType: 'room', actionValue: 'r2', color: '#00BFA5' },
];

export const mockEvents = [
  { id: 'e1', title: 'Festival de Verano', date: 'Viernes 20:00', description: 'Gana doble XP en salas' },
];

export const mockHosts = [
  { id: 'h1', name: 'DJ_Luna', username: 'djluna', avatar: '👩‍🎤', level: 25, followers: 15400 },
  { id: 'h2', name: 'Carlos_King', username: 'carlosk', avatar: '👑', level: 42, followers: 32000 },
  { id: 'h3', name: 'GamerGirl_Vivi', username: 'vivigamer', avatar: '👾', level: 18, followers: 8900 },
  { id: 'h4', name: 'Sofi_Debates', username: 'sofid', avatar: '🍕', level: 12, followers: 4200 },
];

export const mockMissions = [
  { id: 'm1', title: 'Socializador', description: 'Entra a una sala de voz', progress: 0, total: 1, reward: 50 },
  { id: 'm2', title: 'Apoyo incondicional', description: 'Mira un live por 5 minutos', progress: 5, total: 5, reward: 100 },
  { id: 'm3', title: 'Gamer', description: 'Juega una partida de Ludo', progress: 0, total: 1, reward: 80 },
];

