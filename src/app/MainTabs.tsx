import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabsParamList, TAB_ROUTES } from './routes';
import { colors } from '../theme';

import { HomeScreen } from '../screens/HomeScreen';
import { RoomsScreen } from '../screens/RoomsScreen';
import { LivesScreen } from '../screens/LivesScreen';
import { GamesScreen } from '../screens/GamesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const TabIcon = ({ emoji, focused, label }: { emoji: string; focused: boolean; label: string }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.5 }]}>{emoji}</Text>
    <Text style={[styles.tabLabel, { color: focused ? colors.primary : colors.textMuted }]}>
      {label}
    </Text>
  </View>
);

export const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name={TAB_ROUTES.HOME}
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} label="Inicio" />,
        }}
      />
      <Tab.Screen
        name={TAB_ROUTES.ROOMS}
        component={RoomsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎙️" focused={focused} label="Salas" />,
        }}
      />
      <Tab.Screen
        name={TAB_ROUTES.LIVES}
        component={LivesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📺" focused={focused} label="Lives" />,
        }}
      />
      <Tab.Screen
        name={TAB_ROUTES.GAMES}
        component={GamesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎮" focused={focused} label="Juegos" />,
        }}
      />
      <Tab.Screen
        name={TAB_ROUTES.PROFILE}
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} label="Perfil" />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#151221',
    borderTopWidth: 1.5,
    borderTopColor: '#292440',
    height: 75,
    paddingTop: 10,
    paddingBottom: 15,
    position: 'absolute',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 5,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 24,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: 'bold',
  },
});
