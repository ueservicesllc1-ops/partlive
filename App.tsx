import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/app/AppNavigator';
import { AuthProvider } from './src/store/AuthContext';
import { APP_VERSION } from './src/constants/appVersion';

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        {/* Visible Version Indicator at top center */}
        <View pointerEvents="none" style={styles.versionBadgeContainer}>
          <View style={styles.versionBadge}>
            <View style={styles.versionDot} />
            <Text style={styles.versionText}>BUILD {APP_VERSION}</Text>
          </View>
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  versionBadgeContainer: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 12, 30, 0.85)',
    borderColor: 'rgba(0, 230, 118, 0.6)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 6,
  },
  versionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E676',
  },
  versionText: {
    color: '#00E676',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

export default App;

