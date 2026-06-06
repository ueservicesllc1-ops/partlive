export const FirestoreCollections = {
  // Main Collections
  USERS: 'users',
  ROOMS: 'rooms',
  LIVES: 'lives',
  GAMES: 'games',
  GIFTS: 'gifts',
  WALLETS: 'wallets',
  WALLET_TRANSACTIONS: 'walletTransactions',
  COIN_PACKAGES: 'coinPackages',
  RANKINGS: 'rankings',
  FOLLOWS: 'follows',
  REPORTS: 'reports',
  BLOCKS: 'blocks',
  NOTIFICATIONS: 'notifications',
  EVENTS: 'events',
  BANNERS: 'banners',
  MISSIONS: 'missions',
  HOST_APPLICATIONS: 'hostApplications',
  HOST_PAYOUTS: 'hostPayouts',
  HOST_PAYOUT_METHODS: 'hostPayoutMethods',
  HOST_STATS: 'hostStats',
  HOST_ACTIVITIES: 'hostActivities',
  HOST_RULES: 'hostRules',
  MODERATION_LOGS: 'moderationLogs',
  UPLOADS: 'uploads',
} as const;

// Subcollection Helpers
export const getRoomMessagesPath = (roomId: string) => `${FirestoreCollections.ROOMS}/${roomId}/messages`;
export const getRoomMembersPath = (roomId: string) => `${FirestoreCollections.ROOMS}/${roomId}/members`;
export const getRoomGiftEventsPath = (roomId: string) => `${FirestoreCollections.ROOMS}/${roomId}/giftEvents`;
export const getRoomMicRequestsPath = (roomId: string) => `${FirestoreCollections.ROOMS}/${roomId}/micRequests`;

export const getLiveMessagesPath = (liveId: string) => `${FirestoreCollections.LIVES}/${liveId}/messages`;
export const getLiveViewersPath = (liveId: string) => `${FirestoreCollections.LIVES}/${liveId}/viewers`;
export const getLiveGiftEventsPath = (liveId: string) => `${FirestoreCollections.LIVES}/${liveId}/giftEvents`;
export const getLiveModeratorsPath = (liveId: string) => `${FirestoreCollections.LIVES}/${liveId}/moderators`;

export const getUserNotificationsPath = (uid: string) => `${FirestoreCollections.USERS}/${uid}/notifications`;
export const getUserDevicesPath = (uid: string) => `${FirestoreCollections.USERS}/${uid}/devices`;
export const getUserBlockedUsersPath = (uid: string) => `${FirestoreCollections.USERS}/${uid}/blockedUsers`;
export const getUserWalletTransactionsPath = (uid: string) => `${FirestoreCollections.USERS}/${uid}/walletTransactions`;
export const getUserDailyMissionsPath = (uid: string) => `${FirestoreCollections.USERS}/${uid}/dailyMissions`;
