import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { LyricsViewer } from '../../components/karaoke/LyricsViewer';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../app/navigationTypes';
import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../constants/firestoreCollections';

type Props = NativeStackScreenProps<MainStackParamList, 'KaraokePerformance'>;

export const KaraokePerformanceScreen: React.FC<Props> = ({ route, navigation }) => {
  const { performanceId, title, artist, instrumentalUrl, lyricsText } = route.params;

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [beans, setBeans] = useState(0);
  const duration = 180; // Default song duration

  // Listen to performance statistics in real-time to show live gift updates!
  useEffect(() => {
    if (!performanceId) return;
    const unsubscribe = firestore()
      .collection(FirestoreCollections.KARAOKE_PERFORMANCES)
      .doc(performanceId)
      .onSnapshot((doc) => {
        if (doc.exists()) {
          const data = doc.data()!;
          setDiamonds(data.giftsReceivedDiamonds || 0);
          setBeans(data.beansGenerated || 0);
        }
      }, err => {
        console.error('Error listening to performance stats:', err);
      });

    return () => unsubscribe();
  }, [performanceId]);

  // Simulate progress
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= duration) {
          clearInterval(interval);
          setIsPlaying(false);
          return duration;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 22, color: colors.text }}>❌</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>💎</Text>
          <Text style={styles.statVal}>{diamonds}</Text>
          <Text style={styles.statLabel}>Diamonds</Text>
        </View>
        <View style={[styles.statBox, { borderColor: colors.accent }]}>
          <Text style={styles.statIcon}>🫘</Text>
          <Text style={styles.statVal}>{beans}</Text>
          <Text style={styles.statLabel}>Beans</Text>
        </View>
      </View>

      {/* Album cover / micro-visualization */}
      <View style={styles.visualizerContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300' }}
          style={[styles.albumCover, isPlaying && styles.albumCoverPlaying]}
        />
        <Text style={styles.artistName}>{artist}</Text>
      </View>

      {/* Lyrics Viewer */}
      <View style={styles.lyricsContainer}>
        <LyricsViewer
          lyricsText={
            lyricsText ||
            'Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.\n\nTwas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed.'
          }
          durationSeconds={duration}
          isPlaying={isPlaying}
          currentProgressSeconds={progress}
        />
      </View>

      {/* Progress Bar & Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.timeText}>{formatTime(progress)}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(progress / duration) * 100}%` }]} />
          </View>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => setProgress(Math.max(0, progress - 10))}>
            <Text style={{ fontSize: 20 }}>⏮️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.playBtn} onPress={() => setIsPlaying(!isPlaying)}>
            <Text style={{ fontSize: 24, color: colors.text }}>{isPlaying ? '⏸️' : '▶️'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={() => setProgress(Math.min(duration, progress + 10))}>
            <Text style={{ fontSize: 20 }}>⏭️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    maxWidth: 240,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 16,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  statIcon: {
    fontSize: 16,
  },
  statVal: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 'auto',
  },
  visualizerContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  albumCover: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.surfaceLight,
  },
  albumCoverPlaying: {
    transform: [{ rotate: '0deg' }], // Dynamic rotation would be added via Reanimated
    borderColor: colors.accent,
  },
  artistName: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 10,
    fontWeight: '600',
  },
  lyricsContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 20,
  },
  controlsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    width: 36,
    textAlign: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  controlBtn: {
    padding: 8,
  },
  playBtn: {
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.4,
  },
});
