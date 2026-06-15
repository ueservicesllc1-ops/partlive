export type UserRankName =
  | 'novice'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'crown'
  | 'legend';

export interface UserRankConfig {
  name: UserRankName;
  label: string;
  minXp: number;
  badgeColor: string;
  level: number;
}
