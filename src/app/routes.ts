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

  EDIT_PROFILE: 'EditProfile' as const,
  PUBLIC_PROFILE: 'PublicProfile' as const,
  SETTINGS: 'Settings' as const,

  HOST_DASHBOARD: 'HostDashboard' as const,
  HOST_APPLICATION: 'HostApplication' as const,
  HOST_RULES: 'HostRules' as const,
  HOST_EARNINGS: 'HostEarnings' as const,
  HOST_ACTIVITY: 'HostActivity' as const,

  HOST_PAYOUTS: 'HostPayouts' as const,
  REQUEST_PAYOUT: 'RequestPayout' as const,
  PAYOUT_METHODS: 'PayoutMethods' as const,
  ADD_PAYOUT_METHOD: 'AddPayoutMethod' as const,
  PAYOUT_DETAILS: 'PayoutDetails' as const,
};

export const ROOT_ROUTES = {
  AUTH: 'Auth' as const,
  SETUP: 'Setup' as const,
  MAIN_STACK: 'MainStack' as const,
};
