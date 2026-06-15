export * from './navigationTypes';

export const AUTH_ROUTES = {
  LOGIN: 'Login' as const,
  REGISTER: 'Register' as const,
  FORGOT_PASSWORD: 'ForgotPassword' as const,
};

export const SETUP_ROUTES = {
  PROFILE_SETUP: 'ProfileSetup' as const,
};

export const TAB_ROUTES = {
  HOME: 'HomeTab' as const,
  ROOMS: 'RoomsTab' as const,
  LIVES: 'LivesTab' as const,
  GAMES: 'GamesTab' as const,
  PROFILE: 'ProfileTab' as const,
};

export const MAIN_ROUTES = {
  MAIN_TABS: 'MainTabs' as const,
  NOTIFICATIONS: 'Notifications' as const,
  WALLET: 'Wallet' as const,
  RANKINGS: 'Rankings' as const,
  EVENTS: 'Events' as const,
  SEARCH: 'Search' as const,
  ROOM_DETAILS: 'RoomDetails' as const,
  CREATE_ROOM: 'CreateRoom' as const,
  LIVE_DETAILS: 'LiveDetails' as const,
  START_LIVE: 'StartLive' as const,
  GAME_DETAILS: 'GameDetails' as const,
  GAME_SESSION: 'GameSession' as const,
  GAME_INVITES: 'GameInvites' as const,

  EDIT_PROFILE: 'EditProfile' as const,
  PUBLIC_PROFILE: 'PublicProfile' as const,
  SETTINGS: 'Settings' as const,

  HOST_DASHBOARD: 'HostDashboard' as const,
  HOST_APPLICATION: 'HostApplication' as const,
  HOST_RULES: 'HostRules' as const,
  HOST_EARNINGS: 'HostEarnings' as const,
  HOST_ACTIVITY: 'HostActivity' as const,
  HOST_ANALYTICS: 'HostAnalytics' as const,
  AGENCY_ANALYTICS: 'AgencyAnalytics' as const,

  HOST_PAYOUTS: 'HostPayouts' as const,
  REQUEST_PAYOUT: 'RequestPayout' as const,
  PAYOUT_METHODS: 'PayoutMethods' as const,
  ADD_PAYOUT_METHOD: 'AddPayoutMethod' as const,
  PAYOUT_DETAILS: 'PayoutDetails' as const,
  MISSIONS: 'Missions' as const,
  NOTIFICATION_SETTINGS: 'NotificationSettings' as const,
  SOCIAL_LIST: 'SocialList' as const,
  SOCIAL_FEED: 'SocialFeed' as const,
  PRIVACY_SETTINGS: 'PrivacySettings' as const,
  PRIVATE_CONVERSATIONS: 'PrivateConversations' as const,
  PRIVATE_CHAT: 'PrivateChat' as const,
  MESSAGE_REQUESTS: 'MessageRequests' as const,
  PRIVATE_CHAT_SETTINGS: 'PrivateChatSettings' as const,
  KARAOKE_HOME: 'KaraokeHome' as const,
  KARAOKE_SONG_SEARCH: 'KaraokeSongSearch' as const,
  KARAOKE_QUEUE: 'KaraokeQueue' as const,
  KARAOKE_PERFORMANCE: 'KaraokePerformance' as const,
  KARAOKE_BATTLE: 'KaraokeBattle' as const,
  MY_KARAOKE_HISTORY: 'MyKaraokeHistory' as const,
  PK_HISTORY: 'PkHistory' as const,
  PK_RESULTS: 'PkResults' as const,
  AGENCY_APPLICATION: 'AgencyApplication' as const,
  AGENCY_DASHBOARD: 'AgencyDashboard' as const,
  AGENCY_HOSTS: 'AgencyHosts' as const,
  VERIFICATION_START: 'VerificationStart' as const,
  VERIFICATION_FORM: 'VerificationForm' as const,
};

export const ROOT_ROUTES = {
  AUTH: 'Auth' as const,
  SETUP: 'Setup' as const,
  MAIN_STACK: 'MainStack' as const,
  SUSPENDED: 'Suspended' as const,
  BANNED: 'Banned' as const,
};
