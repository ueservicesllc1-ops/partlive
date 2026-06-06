import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { useAuth } from '../store/AuthContext';

import { SplashScreen } from '../screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { ROOT_ROUTES, RootStackParamList, SetupStackParamList } from './routes';

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
  const { isAuthenticated, isProfileCompleted, initializing } = useAuth();

  if (initializing) {
    return <SplashScreen navigation={null as any} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name={ROOT_ROUTES.AUTH} component={AuthNavigator} />
        ) : !isProfileCompleted ? (
          <Stack.Screen name={ROOT_ROUTES.SETUP} component={SetupNavigator} />
        ) : (
          <Stack.Screen name={ROOT_ROUTES.MAIN_STACK} component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
