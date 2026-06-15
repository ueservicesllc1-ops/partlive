import { UserRankConfig } from '../types/rank';

export const USER_RANKS: UserRankConfig[] = [
  { name: 'novice', label: 'Novato', minXp: 0, badgeColor: '#B0BEC5', level: 1 },
  { name: 'bronze', label: 'Bronce', minXp: 1000, badgeColor: '#CD7F32', level: 2 },
  { name: 'silver', label: 'Plata', minXp: 5000, badgeColor: '#C0C0C0', level: 3 },
  { name: 'gold', label: 'Oro', minXp: 15000, badgeColor: '#FFD700', level: 4 },
  { name: 'platinum', label: 'Platino', minXp: 50000, badgeColor: '#E5E4E2', level: 5 },
  { name: 'diamond', label: 'Diamante', minXp: 150000, badgeColor: '#00E5FF', level: 6 },
  { name: 'crown', label: 'Corona', minXp: 500000, badgeColor: '#FF9100', level: 7 },
  { name: 'legend', label: 'Leyenda', minXp: 1000000, badgeColor: '#D500F9', level: 8 },
];
