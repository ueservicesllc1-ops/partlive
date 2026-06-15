import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../store/AuthContext';
import { getSingerPerformances } from '../../services/api/karaokeApi';
import { KaraokePerformance } from '../../types/karaoke';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../app/navigationTypes';

type Props = NativeStackScreenProps<MainStackParamList, 'MyKaraokeHistory'>;

export const MyKaraokeHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<KaraokePerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.uid) return;
      try {
        const data = await getSingerPerformances(user.uid);
        setHistory(data);
      } catch (err) {
        console.error('Error loading singer performances:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [user?.uid]);

  const renderPerformanceItem = ({ item }: { item: KaraokePerformance }) => {
    // Format timestamp
    const dateStr = item.completedAt ? new Date(item.completedAt).toLocaleDateString() : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.songId.replace('song_', '').replace(/_/g, ' ').toUpperCase()}
          </Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Diamantes</Text>
            <Text style={styles.detailValue}>💎 {item.giftsReceivedDiamonds}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Semillas/Beans</Text>
            <Text style={styles.detailValue}>🫘 {item.beansGenerated}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.text }}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Historial de Canto 🎤</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 36 }}>🎵</Text>
          <Text style={styles.emptyText}>Aún no has completado ninguna presentación.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderPerformanceItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  songTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailBox: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
