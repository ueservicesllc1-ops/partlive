import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

import { SplashScreen } from '../screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { SuspendedAccountScreen } from '../screens/moderation/SuspendedAccountScreen';
import { BannedAccountScreen } from '../screens/moderation/BannedAccountScreen';
import { ROOT_ROUTES, RootStackParamList, SetupStackParamList } from './routes';
import { NotificationProvider } from '../components/notifications/NotificationProvider';
import { useAppSessionTracking } from '../hooks/useAppSessionTracking';

const Stack = createNativeStackNavigator<RootStackParamList>();
const SetupStack = createNativeStackNavigator<SetupStackParamList>();

const SetupNavigator = () => {
  return (
    <SetupStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <SetupStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </SetupStack.Navigator>
  );
};

export const AppNavigator = () => {
  const { isAuthenticated, isProfileCompleted, initializing, userProfile } = useAuth();
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  
  // Track active sessions and heartbeats
  useAppSessionTracking();

  // Show "reconectado" banner briefly when recovering from offline
  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const t = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline, wasOffline]);

  if (initializing) {
    return <SplashScreen navigation={null as any} />;
  }

  // Route based on user status if authenticated
  const isSuspended = isAuthenticated && userProfile?.status === 'suspended';
  const isBanned = isAuthenticated && (userProfile?.status === 'banned' || userProfile?.status === 'deleted');

  return (
    <NavigationContainer>
      <NotificationProvider>
        {/* ─── Offline / Reconnected Banner ─── */}
        {!isOnline && (
          <View style={networkStyles.offlineBanner}>
            <Text style={networkStyles.offlineText}>📡 Sin conexión a internet</Text>
          </View>
        )}
        {showReconnected && (
          <View style={networkStyles.reconnectedBanner}>
            <Text style={networkStyles.reconnectedText}>✅ Conexión restaurada</Text>
          </View>
        )}
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          {isBanned ? (
            <Stack.Screen name={ROOT_ROUTES.BANNED} component={BannedAccountScreen} />
          ) : isSuspended ? (
            <Stack.Screen name={ROOT_ROUTES.SUSPENDED} component={SuspendedAccountScreen} />
          ) : !isAuthenticated ? (
            <Stack.Screen name={ROOT_ROUTES.AUTH} component={AuthNavigator} />
          ) : !isProfileCompleted ? (
            <Stack.Screen name={ROOT_ROUTES.SETUP} component={SetupNavigator} />
          ) : (
            <Stack.Screen name={ROOT_ROUTES.MAIN_STACK} component={MainNavigator} />
          )}
        </Stack.Navigator>
      </NotificationProvider>
    </NavigationContainer>
  );
};

const networkStyles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: colors.error,
    paddingVertical: 8,
    alignItems: 'center',
    zIndex: 9999,
  },
  offlineText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  reconnectedBanner: {
    backgroundColor: colors.success,
    paddingVertical: 8,
    alignItems: 'center',
    zIndex: 9999,
  },
  reconnectedText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
