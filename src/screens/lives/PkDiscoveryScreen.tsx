import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';
import { PkBattle } from '../../types/pk';
import firestore from '@react-native-firebase/firestore';
import { formatCoins } from '../../utils/formatNumbers';

export const PkDiscoveryScreen = ({ navigation }: any) => {
  const [battles, setBattles] = useState<PkBattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActiveBattles = async () => {
    try {
      const snap = await firestore()
        .collection('pkBattles')
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PkBattle[];

      setBattles(list);
    } catch (err) {
      console.error('[PkDiscoveryScreen] Error fetching active PKs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveBattles();

    // Listen in real-time
    const unsubscribe = firestore()
      .collection('pkBattles')
      .where('status', '==', 'active')
      .onSnapshot((snap) => {
        if (!snap) return;
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PkBattle[];
        setBattles(list);
      });

    return () => unsubscribe();
  }, []);

  const handleJoinBattle = (battle: PkBattle) => {
    navigation.navigate('LiveDetails', {
      liveId: battle.hostALiveId,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="⚔️ Batallas PK En Vivo"
        showWallet={true}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando duelos PK...</Text>
        </View>
      ) : (
        <FlatList
          data={battles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchActiveBattles();
              }}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>⚔️</Text>
              <Text style={styles.emptyTitle}>No hay batallas PK en este momento</Text>
              <Text style={styles.emptySubtext}>
                Sé el primero en iniciar un duelo transmitiendo en vivo.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCloseBattle = Math.abs(item.hostAScore - item.hostBScore) < Math.max(100, (item.hostAScore + item.hostBScore) * 0.1);
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => handleJoinBattle(item)}
              >
                {/* Header Tag */}
                <View style={styles.cardHeader}>
                  <View style={styles.liveTag}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveTagText}>EN VIVO</Text>
                  </View>
                  {isCloseBattle && (
                    <View style={styles.closeTag}>
                      <Text style={styles.closeTagText}>🔥 DUELO CAÑÓN</Text>
                    </View>
                  )}
                </View>

                {/* Versus Matchup */}
                <View style={styles.versusRow}>
                  <View style={styles.hostCol}>
                    <Text style={styles.hostName} numberOfLines={1}>
                      {item.hostAName}
                    </Text>
                    <Text style={styles.scoreText}>💎 {formatCoins(item.hostAScore)}</Text>
                  </View>

                  <View style={styles.vsBadge}>
                    <Text style={styles.vsText}>VS</Text>
                  </View>

                  <View style={styles.hostCol}>
                    <Text style={styles.hostName} numberOfLines={1}>
                      {item.hostBName}
                    </Text>
                    <Text style={styles.scoreText}>💎 {formatCoins(item.hostBScore)}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoinBattle(item)}>
                  <Text style={styles.joinBtnText}>👁️ Ver Batalla en Vivo</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 12,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#1E1B30',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#342D54',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 45, 85, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF2D55',
    marginRight: 6,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FF2D55',
  },
  closeTag: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  closeTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  versusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  hostCol: {
    flex: 1,
    alignItems: 'center',
  },
  hostName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  vsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF',
    fontStyle: 'italic',
  },
  joinBtn: {
    backgroundColor: '#26203D',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
