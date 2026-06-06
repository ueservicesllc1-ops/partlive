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
import { AddPayoutMethodScreen } from '../screens/host/AddPayoutMethodScreen';
import { PayoutDetailsScreen } from '../screens/host/PayoutDetailsScreen';

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
      
      <Stack.Screen name={MAIN_ROUTES.ROOM_DETAILS} component={RoomDetailsScreen} />
      <Stack.Screen name={MAIN_ROUTES.CREATE_ROOM} component={CreateRoomScreen} />
      <Stack.Screen name={MAIN_ROUTES.LIVE_DETAILS} component={LiveDetailsScreen} />
      <Stack.Screen name={MAIN_ROUTES.START_LIVE} component={StartLiveScreen} />
      <Stack.Screen name={MAIN_ROUTES.GAME_DETAILS} component={GameDetailsScreen} />

      
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
    </Stack.Navigator>
  );
};
