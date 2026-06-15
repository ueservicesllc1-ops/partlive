import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';
import { colors } from '../../theme/colors';

interface LyricsViewerProps {
  lyricsText: string;
  durationSeconds: number;
  isPlaying: boolean;
  currentProgressSeconds?: number;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({
  lyricsText,
  durationSeconds,
  isPlaying,
  currentProgressSeconds = 0,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const lines = lyricsText.split('\n').filter(line => line.trim().length > 0);
  const totalLines = lines.length;

  const [activeLineIndex, setActiveLineIndex] = useState(0);

  // Simple simulator if no currentProgressSeconds is passed but isPlaying is true
  const [internalTime, setInternalTime] = useState(0);

  useEffect(() => {
    if (currentProgressSeconds > 0) {
      setInternalTime(currentProgressSeconds);
      return;
    }
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setInternalTime(prev => {
        if (prev >= durationSeconds) {
          clearInterval(interval);
          return durationSeconds;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, durationSeconds, currentProgressSeconds]);

  // Calculate active line index by dividing duration by total lines
  useEffect(() => {
    if (totalLines === 0) return;
    const secondsPerLine = durationSeconds / totalLines;
    const nextLineIndex = Math.min(
      Math.floor(internalTime / secondsPerLine),
      totalLines - 1
    );
    setActiveLineIndex(nextLineIndex);

    // Auto-scroll logic
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: nextLineIndex * 40 - 80, // 40 is approx line height, offset to center
        animated: true,
      });
    }
  }, [internalTime, totalLines, durationSeconds]);

  if (lines.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay letra disponible para esta canción.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {lines.map((line, index) => {
          const isActive = index === activeLineIndex;
          return (
            <View key={index} style={[styles.lineWrapper, isActive && styles.activeLineWrapper]}>
              <Text style={[styles.lineText, isActive && styles.activeLineText]}>
                {line}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 220,
    backgroundColor: 'rgba(21, 18, 33, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingVertical: 80, // Padding to start/end in center
    alignItems: 'center',
  },
  lineWrapper: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  activeLineWrapper: {
    transform: [{ scale: 1.1 }],
  },
  lineText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeLineText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 229, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  emptyContainer: {
    height: 220,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
