import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { useAuth } from '../store/AuthContext';

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
  
  // Track active sessions and heartbeats
  useAppSessionTracking();

  if (initializing) {
    return <SplashScreen navigation={null as any} />;
  }

  // Route based on user status if authenticated
  const isSuspended = isAuthenticated && userProfile?.status === 'suspended';
  const isBanned = isAuthenticated && (userProfile?.status === 'banned' || userProfile?.status === 'deleted');

  return (
    <NavigationContainer>
      <NotificationProvider>
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
