import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';
import { Avatar } from '../../components/Avatar';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../store/AuthContext';

export const FavoriteHostsScreen = ({ navigation }: any) => {
  const { userProfile } = useAuth();
  const [favoriteHosts, setFavoriteHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    // Fetch followed hosts
    const unsub = firestore()
      .collection('users')
      .doc(userProfile.uid)
      .collection('following')
      .onSnapshot(async (snap) => {
        if (!snap) return;
        const hostIds = snap.docs.map((d) => d.id);

        if (hostIds.length === 0) {
          setFavoriteHosts([]);
          setLoading(false);
          return;
        }

        // Fetch host details & live statuses
        try {
          const hostsSnap = await firestore()
            .collection('users')
            .where(firestore.FieldPath.documentId(), 'in', hostIds.slice(0, 10))
            .get();

          const list = await Promise.all(
            hostsSnap.docs.map(async (doc) => {
              const data = doc.data();
              // Check if currently live
              const liveSnap = await firestore()
                .collection('lives')
                .where('hostId', '==', doc.id)
                .where('status', '==', 'live')
                .limit(1)
                .get();

              return {
                id: doc.id,
                displayName: data.displayName || 'Anfitrión',
                photoURL: data.photoURL || '',
                isLiveNow: !liveSnap.empty,
                liveId: !liveSnap.empty ? liveSnap.docs[0].id : null,
                liveTitle: !liveSnap.empty ? liveSnap.docs[0].data().title : null,
              };
            })
          );

          setFavoriteHosts(list);
        } catch (err) {
          console.error('[FavoriteHostsScreen] Error loading hosts:', err);
        } finally {
          setLoading(false);
        }
      });

    return () => unsub();
  }, [userProfile]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="❤️ Mis Anfitriones Favoritos"
        showWallet={true}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando anfitriones favoritos...</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteHosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎙️</Text>
              <Text style={styles.emptyTitle}>Aún no sigues a ningún anfitrión</Text>
              <Text style={styles.emptySub}>
                Sigue a tus anfitriones favoritos para ver sus transmisiones y estado de seguidor.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => {
                if (item.isLiveNow && item.liveId) {
                  navigation.navigate('LiveDetails', { liveId: item.liveId });
                } else {
                  navigation.navigate('PublicProfile', { userId: item.id });
                }
              }}
            >
              <Avatar source={item.photoURL} emoji="👤" size={48} />
              <View style={styles.infoCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.hostName}>{item.displayName}</Text>
                  {item.isLiveNow && (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>EN VIVO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.subText}>
                  {item.isLiveNow ? item.liveTitle || 'Transmitiendo en vivo' : 'Desconectado'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B30',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#342D54',
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 45, 85, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF2D55',
    marginRight: 4,
  },
  liveText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FF2D55',
  },
  subText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  emptySub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
