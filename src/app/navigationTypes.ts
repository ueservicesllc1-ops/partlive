import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Setup Stack
export type SetupStackParamList = {
  ProfileSetup: undefined;
};

// Main Tabs (Bottom)
export type MainTabsParamList = {
  HomeTab: undefined;
  RoomsTab: undefined;
  LivesTab: undefined;
  GamesTab: undefined;
  ProfileTab: undefined;
};

// Main Stack (Global screens wrapped around Tabs)
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  Notifications: undefined;
  Wallet: undefined;
  Rankings: undefined;
  Events: undefined;
  Search: { initialQuery?: string } | undefined;
  RoomDetails: { roomId: string };
  CreateRoom: undefined;
  LiveDetails: { liveId: string };
  StartLive: undefined;
  GameDetails: { gameId: string };
  GameSession: { sessionId: string; gameSlug: string; gameTitle: string };
  GameInvites: undefined;

  EditProfile: undefined;
  PublicProfile: { userId: string };
  Settings: undefined;

  HostDashboard: undefined;
  HostApplication: undefined;
  HostRules: undefined;
  HostEarnings: undefined;
  HostActivity: undefined;

  HostPayouts: undefined;
  RequestPayout: undefined;
  PayoutMethods: undefined;
  AddPayoutMethod: undefined;
  PayoutDetails: { payoutId: string; initialPayout?: any };
  Missions: undefined;
  NotificationSettings: undefined;
  SocialList: { userId: string; listType: 'followers' | 'following' | 'friends'; title?: string };
  SocialFeed: undefined;
  PrivacySettings: undefined;
  PrivateConversations: undefined;
  PrivateChat: { conversationId?: string; targetUserId?: string };
  MessageRequests: undefined;
  PrivateChatSettings: undefined;
  KaraokeHome: { targetType: 'room' | 'live'; targetId: string };
  KaraokeSongSearch: { targetType: 'room' | 'live'; targetId: string };
  KaraokeQueue: { sessionId: string };
  KaraokePerformance: { performanceId: string; instrumentalUrl: string; title: string; artist: string; lyricsText: string };
  KaraokeBattle: { targetType: 'room' | 'live'; targetId: string };
  MyKaraokeHistory: undefined;
  PkHistory: { hostId: string };
  PkResults: { battle: any };
  AgencyApplication: undefined;
  AgencyDashboard: undefined;
  AgencyHosts: { agencyId: string };
  VerificationStart: undefined;
  VerificationForm: undefined;
  HostAnalytics: undefined;
  AgencyAnalytics: { agencyId: string };
};

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Setup: NavigatorScreenParams<SetupStackParamList>;
  MainStack: NavigatorScreenParams<MainStackParamList>;
  Suspended: undefined;
  Banned: undefined;
};

// Global typing for useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
