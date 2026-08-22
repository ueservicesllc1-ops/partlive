import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';

export const InAppNotificationCenterScreen = ({ navigation }: any) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'LIVES' | 'MESSAGES' | 'GIFTS' | 'PAYMENTS'>('ALL');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/notifications');
      setNotifications(res.notifications || res.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      await apiFetch('/notifications/mark-read', { method: 'POST', body: JSON.stringify({ all: true }) });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, status: 'read' })));
      Alert.alert('Éxito', 'Todas las notificaciones fueron marcadas como leídas.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo marcar como leído.');
    }
  };

  const handlePressNotification = (item: any) => {
    if (item.actionValue) {
      if (item.actionValue.includes('live')) {
        const liveId = item.actionValue.split('/').pop();
        navigation.navigate('LiveDetails', { liveId });
      } else if (item.actionValue.includes('profile')) {
        navigation.navigate('UserProfile');
      } else if (item.actionValue.includes('wallet')) {
        navigation.navigate('Wallet');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🔔 Notificaciones"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => {}}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {/* Category Filter Pills */}
      <View style={styles.filterRow}>
        <ScrollViewHorizontal>
          {(['ALL', 'LIVES', 'MESSAGES', 'GIFTS', 'PAYMENTS'] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, activeCategory === cat && styles.pillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.pillText, activeCategory === cat && styles.pillTextActive]}>
                {cat === 'ALL' ? 'Todas' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollViewHorizontal>

        <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
          <Text style={styles.markReadText}>✓ Leer Todo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id || String(Math.random())}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.itemCard, item.status === 'unread' && styles.itemUnread]}
              onPress={() => handlePressNotification(item)}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.status === 'unread' && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.itemBody}>{item.body}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tienes notificaciones pendientes 🎉</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const ScrollViewHorizontal = ({ children }: any) => (
  <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>{children}</View>
);

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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#26203D',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E1B30',
  },
  pillActive: {
    backgroundColor: colors.accent,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  pillTextActive: {
    color: '#FFF',
  },
  markReadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markReadText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  itemCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 4,
  },
  itemUnread: {
    borderColor: colors.accent,
    backgroundColor: '#1C1635',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  itemBody: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
