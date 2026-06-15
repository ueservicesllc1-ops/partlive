export type FollowStatus = 'active' | 'blocked' | 'removed';
export type FriendStatus = 'active' | 'removed';

export type SocialActivityType =
  | 'follow'
  | 'start_live'
  | 'create_room'
  | 'send_gift'
  | 'receive_gift'
  | 'win_game'
  | 'join_event'
  | 'rank_up'
  | 'vip_activated'
  | 'host_level_up';

export interface Follow {
  id: string; // `${followerId}_${followingId}`
  followerId: string;
  followingId: string;
  status: FollowStatus;
  createdAt: any;
  updatedAt: any;
}

export interface Friend {
  id: string; // sorted order `${userAId}_${userBId}`
  userAId: string;
  userBId: string;
  status: FriendStatus;
  createdAt: any;
  updatedAt: any;
}

export interface SocialActivity {
  id: string;
  userId: string;
  username?: string;
  userPhotoURL?: string;
  type: SocialActivityType;
  title: string;
  description?: string;
  imageUrl?: string;
  actionType?: 'open_profile' | 'open_room' | 'open_live' | 'open_game_session' | 'open_event' | 'none';
  actionValue?: string;
  visibility: 'public' | 'followers' | 'private';
  metadata?: Record<string, any>;
  createdAt: any;
}

export interface RecommendedUser {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  photoURL?: string;
  reason:
    | 'popular_host'
    | 'same_country'
    | 'same_language'
    | 'active_now'
    | 'vip'
    | 'trending'
    | 'friend_of_friend';
  score: number;
}
