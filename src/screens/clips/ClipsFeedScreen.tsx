import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { Avatar } from '../../components/Avatar';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../store/AuthContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ClipsFeedScreen = ({ navigation }: any) => {
  const { userProfile } = useAuth();
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = firestore()
      .collection('clips')
      .where('status', '==', 'PUBLISHED')
      .limit(20)
      .onSnapshot((snap) => {
        if (!snap) return;
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClips(list);
        setLoading(false);
      });

    return () => unsub();
  }, []);

  const handleJoinLive = async (item: any) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      await apiFetch('/clips/interact', {
        method: 'POST',
        body: JSON.stringify({ clipId: item.id, action: 'join_live' }),
      });
      if (item.liveId) {
        navigation.navigate('LiveDetails', { liveId: item.liveId });
      } else {
        navigation.navigate('PublicProfile', { userId: item.hostId });
      }
    } catch (err) {
      console.error('Error joining live from clip:', err);
    }
  };

  const handleLike = async (clipId: string) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      await apiFetch('/clips/interact', {
        method: 'POST',
        body: JSON.stringify({ clipId, action: 'like' }),
      });
    } catch (err) {
      console.error('Error liking clip:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎬 PartyLive Clips</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando Clips...</Text>
        </View>
      ) : (
        <FlatList
          data={clips}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📹</Text>
              <Text style={styles.emptyTitle}>No hay Clips publicados aún</Text>
              <Text style={styles.emptySub}>Los Hosts pueden publicar momentos destacados de sus Lives.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.clipSlide}>
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoEmoji}>🎬</Text>
                <Text style={styles.videoTitle}>{item.title}</Text>
              </View>

              {/* Overlay Actions */}
              <View style={styles.overlayRight}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
                  <Text style={styles.actionEmoji}>❤️</Text>
                  <Text style={styles.actionCount}>{item.likesCount || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionEmoji}>💬</Text>
                  <Text style={styles.actionCount}>Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionEmoji}>🚀</Text>
                  <Text style={styles.actionCount}>{item.sharesCount || 0}</Text>
                </TouchableOpacity>
              </View>

              {/* Overlay Bottom Details */}
              <View style={styles.overlayBottom}>
                <View style={styles.hostRow}>
                  <Avatar source={item.hostPhotoURL} emoji="👤" size={40} />
                  <View style={styles.hostCol}>
                    <Text style={styles.hostName}>{item.hostName || 'Anfitrión'}</Text>
                    <Text style={styles.clipDesc} numberOfLines={2}>{item.description}</Text>
                  </View>
                </View>

                {/* 🔴 JOIN LIVE CTA */}
                <TouchableOpacity style={styles.joinLiveBtn} onPress={() => handleJoinLive(item)}>
                  <Text style={styles.joinLiveText}>🔴 UNIRSE AL LIVE EN VIVO</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0814',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: '#141124',
    borderBottomWidth: 1,
    borderColor: '#26203D',
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 12,
  },
  clipSlide: {
    height: SCREEN_HEIGHT - 120,
    justifyContent: 'flex-end',
    backgroundColor: '#141124',
    position: 'relative',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E1B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  overlayRight: {
    position: 'absolute',
    right: 16,
    bottom: 140,
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionCount: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  overlayBottom: {
    padding: spacing.lg,
    backgroundColor: 'rgba(10, 8, 20, 0.85)',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hostCol: {
    marginLeft: 10,
    flex: 1,
  },
  hostName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  clipDesc: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 2,
  },
  joinLiveBtn: {
    backgroundColor: '#FF2D55',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  joinLiveText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
