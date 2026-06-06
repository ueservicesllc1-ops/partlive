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

  EditProfile: undefined;
  PublicProfile: { userId: string };
  Settings: undefined;

  HostDashboard: undefined;
  HostApplication: undefined;
  HostRules: undefined;
  HostEarnings: undefined;
  HostActivity: undefined;
};

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Setup: NavigatorScreenParams<SetupStackParamList>;
  MainStack: NavigatorScreenParams<MainStackParamList>;
};

// Global typing for useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
