import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../../../theme';
import { GamePlayer } from '../../../types/game';

interface BilliardsGameProps {
  players: GamePlayer[];
  myUserId: string;
  onFinish?: (scores: Record<string, number>) => void;
  onSendMove?: (moveType: string, payload: Record<string, any>) => Promise<void>;
  onBack?: () => void;
}

export const BilliardsGame: React.FC<BilliardsGameProps> = ({
  players,
  myUserId,
  onFinish,
  onBack,
}) => {
  const webViewRef = useRef<WebView>(null);

  const sourceUri =
    Platform.OS === 'android'
      ? { uri: 'file:///android_asset/games/billiards/index.html' }
      : { uri: 'https://carlomigueldy.github.io/cinematic-8ball-pool/' };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'BACK') {
        onBack?.();
      } else if (data.type === 'GAME_END') {
        const scores: Record<string, number> = {};
        if (players.length > 0) {
          scores[myUserId] = data.winner === 0 ? 100 : 0;
          const other = players.find(p => p.userId !== myUserId);
          if (other) {
            scores[other.userId] = data.winner === 1 ? 100 : 0;
          }
        } else {
          scores[myUserId] = 100;
        }
        onFinish?.(scores);
      }
    } catch {
      // Ignorar mensajes no-JSON
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={sourceUri}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
        mixedContentMode="always"
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        onMessage={handleMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03050b',
  },
  webview: {
    flex: 1,
    backgroundColor: '#03050b',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#03050b',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
