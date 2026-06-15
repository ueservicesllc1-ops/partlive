import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList, MAIN_ROUTES } from './routes';
import { colors } from '../theme';

import { MainTabs } from './MainTabs';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { WalletScreen } from '../screens/wallet/WalletScreen';
import { RankingsScreen } from '../screens/rankings/RankingsScreen';
import { EventsScreen } from '../screens/events/EventsScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { CreateRoomScreen } from '../screens/rooms/CreateRoomScreen';
import { RoomDetailsScreen } from '../screens/rooms/RoomDetailsScreen';
import { LiveDetailsScreen } from '../screens/lives/LiveDetailsScreen';
import { StartLiveScreen } from '../screens/lives/StartLiveScreen';
import { GameDetailsScreen } from '../screens/games/GameDetailsScreen';
import { GameSessionScreen } from '../screens/games/GameSessionScreen';
import { GameInvitesScreen } from '../screens/games/GameInvitesScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { PublicProfileScreen } from '../screens/profile/PublicProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { HostDashboardScreen } from '../screens/host/HostDashboardScreen';
import { HostApplicationScreen } from '../screens/host/HostApplicationScreen';
import { HostEarningsScreen } from '../screens/host/HostEarningsScreen';
import { HostActivityScreen } from '../screens/host/HostActivityScreen';
import { HostRulesScreen } from '../screens/host/HostRulesScreen';
import { HostPayoutsScreen } from '../screens/host/HostPayoutsScreen';
import { RequestPayoutScreen } from '../screens/host/RequestPayoutScreen';
import { PayoutMethodsScreen } from '../screens/host/PayoutMethodsScreen';
import { NotificationSettingsScreen } from '../screens/notifications/NotificationSettingsScreen';
import { AddPayoutMethodScreen } from '../screens/host/AddPayoutMethodScreen';
import { PayoutDetailsScreen } from '../screens/host/PayoutDetailsScreen';
import { MissionsScreen } from '../screens/missions/MissionsScreen';
import { SocialListScreen } from '../screens/social/SocialListScreen';
import { SocialFeedScreen } from '../screens/social/SocialFeedScreen';
import { PrivacySettingsScreen } from '../screens/settings/PrivacySettingsScreen';
import { PrivateConversationsScreen } from '../screens/privateChat/PrivateConversationsScreen';
import { PrivateChatScreen } from '../screens/privateChat/PrivateChatScreen';
import { MessageRequestsScreen } from '../screens/privateChat/MessageRequestsScreen';
import { PrivateChatSettingsScreen } from '../screens/privateChat/PrivateChatSettingsScreen';

import { KaraokeHomeScreen } from '../screens/karaoke/KaraokeHomeScreen';
import { KaraokeSongSearchScreen } from '../screens/karaoke/KaraokeSongSearchScreen';
import { KaraokeQueueScreen } from '../screens/karaoke/KaraokeQueueScreen';
import { KaraokePerformanceScreen } from '../screens/karaoke/KaraokePerformanceScreen';
import { KaraokeBattleScreen } from '../screens/karaoke/KaraokeBattleScreen';
import { MyKaraokeHistoryScreen } from '../screens/karaoke/MyKaraokeHistoryScreen';
import { PkHistoryScreen } from '../screens/lives/PkHistoryScreen';
import { PkResultsScreen } from '../screens/lives/PkResultsScreen';
import { AgencyApplicationScreen } from '../screens/host/AgencyApplicationScreen';
import { AgencyDashboardScreen } from '../screens/host/AgencyDashboardScreen';
import { AgencyHostsScreen } from '../screens/host/AgencyHostsScreen';
import { VerificationStartScreen } from '../screens/host/VerificationStartScreen';
import { VerificationFormScreen } from '../screens/host/VerificationFormScreen';
import { HostAnalyticsScreen } from '../screens/host/HostAnalyticsScreen';
import { AgencyAnalyticsScreen } from '../screens/host/AgencyAnalyticsScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name={MAIN_ROUTES.MAIN_TABS} component={MainTabs} />
      
      {/* Rutas internas que ocultan el Bottom Tab al abrirse */}
      <Stack.Screen name={MAIN_ROUTES.NOTIFICATIONS} component={NotificationsScreen} />
      <Stack.Screen name={MAIN_ROUTES.WALLET} component={WalletScreen} />
      <Stack.Screen name={MAIN_ROUTES.RANKINGS} component={RankingsScreen} />
      <Stack.Screen name={MAIN_ROUTES.EVENTS} component={EventsScreen} />
      <Stack.Screen name={MAIN_ROUTES.SEARCH} component={SearchScreen} />
      <Stack.Screen name={MAIN_ROUTES.MISSIONS} component={MissionsScreen} />
      <Stack.Screen name={MAIN_ROUTES.NOTIFICATION_SETTINGS} component={NotificationSettingsScreen} />
      <Stack.Screen name={MAIN_ROUTES.SOCIAL_LIST} component={SocialListScreen} />
      <Stack.Screen name={MAIN_ROUTES.SOCIAL_FEED} component={SocialFeedScreen} />
      <Stack.Screen name={MAIN_ROUTES.PRIVACY_SETTINGS} component={PrivacySettingsScreen} />
      
      {/* Private Chat Stack Screens */}
      <Stack.Screen name={MAIN_ROUTES.PRIVATE_CONVERSATIONS} component={PrivateConversationsScreen} />
      <Stack.Screen name={MAIN_ROUTES.PRIVATE_CHAT} component={PrivateChatScreen} />
      <Stack.Screen name={MAIN_ROUTES.MESSAGE_REQUESTS} component={MessageRequestsScreen} />
      <Stack.Screen name={MAIN_ROUTES.PRIVATE_CHAT_SETTINGS} component={PrivateChatSettingsScreen} />
      
      <Stack.Screen name={MAIN_ROUTES.ROOM_DETAILS} component={RoomDetailsScreen} />
      <Stack.Screen name={MAIN_ROUTES.CREATE_ROOM} component={CreateRoomScreen} />
      <Stack.Screen name={MAIN_ROUTES.LIVE_DETAILS} component={LiveDetailsScreen} />
      <Stack.Screen name={MAIN_ROUTES.START_LIVE} component={StartLiveScreen} />
      <Stack.Screen name={MAIN_ROUTES.GAME_DETAILS} component={GameDetailsScreen} />
      <Stack.Screen name={MAIN_ROUTES.GAME_SESSION} component={GameSessionScreen} />
      <Stack.Screen name={MAIN_ROUTES.GAME_INVITES} component={GameInvitesScreen} />

      
      <Stack.Screen name={MAIN_ROUTES.EDIT_PROFILE} component={EditProfileScreen} />
      <Stack.Screen name={MAIN_ROUTES.PUBLIC_PROFILE} component={PublicProfileScreen} />
      <Stack.Screen name={MAIN_ROUTES.SETTINGS} component={SettingsScreen} />

      {/* Host Dashboard Routes */}
      <Stack.Screen name={MAIN_ROUTES.HOST_DASHBOARD} component={HostDashboardScreen} />
      <Stack.Screen name={MAIN_ROUTES.HOST_APPLICATION} component={HostApplicationScreen} />
      <Stack.Screen name={MAIN_ROUTES.HOST_EARNINGS} component={HostEarningsScreen} />
      <Stack.Screen name={MAIN_ROUTES.HOST_ACTIVITY} component={HostActivityScreen} />
      <Stack.Screen name={MAIN_ROUTES.HOST_RULES} component={HostRulesScreen} />

      <Stack.Screen name={MAIN_ROUTES.HOST_PAYOUTS} component={HostPayoutsScreen} />
      <Stack.Screen name={MAIN_ROUTES.REQUEST_PAYOUT} component={RequestPayoutScreen} />
      <Stack.Screen name={MAIN_ROUTES.PAYOUT_METHODS} component={PayoutMethodsScreen} />
      <Stack.Screen name={MAIN_ROUTES.ADD_PAYOUT_METHOD} component={AddPayoutMethodScreen} />
      <Stack.Screen name={MAIN_ROUTES.PAYOUT_DETAILS} component={PayoutDetailsScreen} />

      {/* Karaoke Screens */}
      <Stack.Screen name={MAIN_ROUTES.KARAOKE_HOME} component={KaraokeHomeScreen} />
      <Stack.Screen name={MAIN_ROUTES.KARAOKE_SONG_SEARCH} component={KaraokeSongSearchScreen} />
      <Stack.Screen name={MAIN_ROUTES.KARAOKE_QUEUE} component={KaraokeQueueScreen} />
      <Stack.Screen name={MAIN_ROUTES.KARAOKE_PERFORMANCE} component={KaraokePerformanceScreen} />
      <Stack.Screen name={MAIN_ROUTES.KARAOKE_BATTLE} component={KaraokeBattleScreen} />
      <Stack.Screen name={MAIN_ROUTES.MY_KARAOKE_HISTORY} component={MyKaraokeHistoryScreen} />
      <Stack.Screen name={MAIN_ROUTES.PK_HISTORY} component={PkHistoryScreen} />
      <Stack.Screen name={MAIN_ROUTES.PK_RESULTS} component={PkResultsScreen} />
      <Stack.Screen name={MAIN_ROUTES.AGENCY_APPLICATION} component={AgencyApplicationScreen} />
      <Stack.Screen name={MAIN_ROUTES.AGENCY_DASHBOARD} component={AgencyDashboardScreen} />
      <Stack.Screen name={MAIN_ROUTES.AGENCY_HOSTS} component={AgencyHostsScreen} />
      <Stack.Screen name={MAIN_ROUTES.VERIFICATION_START} component={VerificationStartScreen} />
      <Stack.Screen name={MAIN_ROUTES.VERIFICATION_FORM} component={VerificationFormScreen} />
      <Stack.Screen name={MAIN_ROUTES.HOST_ANALYTICS} component={HostAnalyticsScreen} />
      <Stack.Screen name={MAIN_ROUTES.AGENCY_ANALYTICS} component={AgencyAnalyticsScreen} />
    </Stack.Navigator>
  );
};
