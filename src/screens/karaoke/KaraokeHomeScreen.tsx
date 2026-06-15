import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { useKaraokeSession } from '../../hooks/useKaraokeSession';
import { useKaraokeBattle } from '../../hooks/useKaraokeBattle';
import { KaraokeQueueItem } from '../../components/karaoke/KaraokeQueueItem';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../app/navigationTypes';

type Props = NativeStackScreenProps<MainStackParamList, 'KaraokeHome'>;

export const KaraokeHomeScreen: React.FC<Props> = ({ route, navigation }) => {
  const { targetType, targetId } = route.params;

  const {
    session,
    queue,
    loading,
    isHost,
    currentSingingItem,
    startSession,
    endSession,
    approveSinger,
    rejectSinger,
    startSingerPresentation,
    completeSingerPresentation,
    skipSinger,
  } = useKaraokeSession(targetType, targetId);

  const { battle } = useKaraokeBattle(targetType, targetId);

  const handleGoToSearch = () => {
    navigation.navigate('KaraokeSongSearch', { targetType, targetId });
  };

  const handleGoToBattle = () => {
    navigation.navigate('KaraokeBattle', { targetType, targetId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.text }}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lobby de Karaoke 🎤</Text>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('MyKaraokeHistory')}
        >
          <Text style={{ fontSize: 20 }}>🕒</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!session ? (
          <View style={styles.startSessionContainer}>
            <Text style={{ fontSize: 64, marginBottom: 20 }}>🎵</Text>
            <Text style={styles.emptyTitle}>El Karaoke no está activo</Text>
            <Text style={styles.emptyDesc}>
              {isHost
                ? 'Inicia una sesión para que los espectadores puedan pedir canciones y subir al escenario.'
                : 'Espera a que el host inicie una sesión de Karaoke para empezar a cantar.'}
            </Text>

            {isHost && (
              <TouchableOpacity style={styles.startBtn} onPress={startSession}>
                <Text style={styles.startBtnText}>Activar Karaoke</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {/* Active Singer Card */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ahora Cantando 🎤</Text>
              {currentSingingItem ? (
                <TouchableOpacity
                  style={styles.activeSingerCard}
                  onPress={() =>
                    navigation.navigate('KaraokePerformance', {
                      performanceId: currentSingingItem.id, // using queue item id as initial performance key link
                      instrumentalUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                      title: currentSingingItem.songTitle,
                      artist: 'Presentación en Vivo',
                      lyricsText: 'Letra del Karaoke cargando...',
                    })
                  }
                >
                  <View style={styles.activeSingerInfo}>
                    <Text style={styles.activeSingerName}>{currentSingingItem.singerName}</Text>
                    <Text style={styles.activeSongTitle}>Tema: {currentSingingItem.songTitle}</Text>
                  </View>
                  <View style={styles.activeSingerBadge}>
                    <Text style={styles.activeSingerBadgeText}>Ver Letra</Text>
                    <Text style={{ fontSize: 12 }}>➡️</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.noSingerCard}>
                  <Text style={styles.noSingerText}>Nadie está en el micrófono actualmente.</Text>
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={handleGoToSearch}>
                <Text style={{ fontSize: 24 }}>🔍</Text>
                <Text style={styles.actionText}>Pedir Canción</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionCard, { borderColor: colors.secondary }]} onPress={handleGoToBattle}>
                <Text style={{ fontSize: 24 }}>🏆</Text>
                <Text style={styles.actionText}>Batallas</Text>
              </TouchableOpacity>
            </View>

            {/* Battle Notice */}
            {battle && (
              <TouchableOpacity style={styles.battleNotice} onPress={handleGoToBattle}>
                <Text style={{ fontSize: 16 }}>🔥</Text>
                <Text style={styles.battleNoticeText}>¡Hay una batalla activa de Karaoke! Entrar y Votar</Text>
                <Text style={{ fontSize: 12 }}>➡️</Text>
              </TouchableOpacity>
            )}

            {/* Singer Queue */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Cola de Cantantes ({queue.length})</Text>
                {isHost && (
                  <TouchableOpacity style={styles.endBtn} onPress={endSession}>
                    <Text style={styles.endBtnText}>Desactivar</Text>
                  </TouchableOpacity>
                )}
              </View>

              {queue.length === 0 ? (
                <View style={styles.emptyQueueCard}>
                  <Text style={styles.emptyQueueText}>La cola está vacía. ¡Sé el primero en pedir un tema!</Text>
                  <TouchableOpacity style={styles.queueSearchBtn} onPress={handleGoToSearch}>
                    <Text style={styles.queueSearchBtnText}>Buscar Canción</Text>
                  </TouchableOpacity>
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
            </View>
          </>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
  historyBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  startSessionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
  },
  icon: {
    marginBottom: 20,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyDesc: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  startBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  startBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  activeSingerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(138, 79, 255, 0.12)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activeSingerInfo: {
    flex: 1,
  },
  activeSingerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  activeSongTitle: {
    color: colors.accent,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
  activeSingerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeSingerBadgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  noSingerCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  noSingerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  battleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 196, 0, 0.1)',
    borderWidth: 1,
    borderColor: colors.warning,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  battleNoticeText: {
    flex: 1,
    color: colors.warning,
    fontSize: 13,
    fontWeight: '600',
  },
  endBtn: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  endBtnText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyQueueCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyQueueText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  queueSearchBtn: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  queueSearchBtnText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
});
