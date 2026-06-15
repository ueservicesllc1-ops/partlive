import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { useKaraokeSession } from '../../hooks/useKaraokeSession';
import { KaraokeQueueItem } from '../../components/karaoke/KaraokeQueueItem';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../app/navigationTypes';

type Props = NativeStackScreenProps<MainStackParamList, 'KaraokeQueue'>;

export const KaraokeQueueScreen: React.FC<Props> = ({ route, navigation }) => {
  const { sessionId } = route.params;

  const {
    queue,
    isHost,
    approveSinger,
    rejectSinger,
    startSingerPresentation,
    completeSingerPresentation,
    skipSinger,
  } = useKaraokeSession('room', 'placeholder_id');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.text }}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fila Detallada 🎤</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {queue.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>La cola está vacía.</Text>
          </View>
        ) : (
          queue.map((item) => (
            <KaraokeQueueItem
              key={item.id}
              item={item}
              isHost={isHost}
              onApprove={() => approveSinger(item.id)}
              onReject={() => rejectSinger(item.id)}
              onStart={() => startSingerPresentation(item.id)}
              onComplete={() => completeSingerPresentation(item.id)}
              onSkip={() => skipSinger(item.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
  },
});
