export interface CategoryOption {
  code: string;
  name: string;
  icon: string;
}

export const ROOM_LIVE_CATEGORIES: CategoryOption[] = [
  { code: 'karaoke', name: 'Karaoke', icon: '🎤' },
  { code: 'gaming', name: 'Gaming', icon: '🎮' },
  { code: 'social', name: 'Social', icon: '💬' },
  { code: 'music', name: 'Música', icon: '🎵' },
  { code: 'talk_show', name: 'Talk Show', icon: '🎙️' },
  { code: 'dance', name: 'Baile', icon: '💃' },
  { code: 'dating', name: 'Dating', icon: '💖' },
  { code: 'debate', name: 'Debate', icon: '🗣️' },
  { code: 'comedy', name: 'Comedia', icon: '😂' },
  { code: 'talent', name: 'Talento', icon: '🌟' },
];

export const GAME_CATEGORIES: CategoryOption[] = [
  { code: 'trivia', name: 'Trivia', icon: '❓' },
  { code: 'casual', name: 'Casual', icon: '🕹️' },
  { code: 'board', name: 'Mesa', icon: '🎲' },
  { code: 'party', name: 'Fiesta', icon: '🥳' },
];

export const EVENT_CATEGORIES: CategoryOption[] = [
  { code: 'top_hosts', name: 'Top Hosts', icon: '👑' },
  { code: 'top_gifters', name: 'Top Gifters', icon: '🎁' },
  { code: 'karaoke_battle', name: 'Batalla Karaoke', icon: '⚔️' },
  { code: 'room_tournament', name: 'Torneo de Salas', icon: '🏰' },
  { code: 'vip_promo', name: 'Promo VIP', icon: '💎' },
];
