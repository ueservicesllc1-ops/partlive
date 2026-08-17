import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../store/AuthContext';

const CATEGORIES = ['ALL', 'KARAOKE', 'PK', 'TRIVIA', 'TALENT', 'PARTY'];

export const EventsScreen = ({ navigation }: any) => {
  const { userProfile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [events, setEvents] = useState<any[]>([]);
  const [reminders, setReminders] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query: any = firestore().collection('events').where('status', '==', 'SCHEDULED');
    if (selectedCategory !== 'ALL') {
      query = query.where('category', '==', selectedCategory);
    }

    const unsub = query.onSnapshot(
      (snap: any) => {
        if (!snap) return;
        const list = snap.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(list);
        setLoading(false);
      },
      (err: any) => {
        console.error('[EventsScreen] Error listening to events:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [selectedCategory]);

  const handleToggleReminder = async (eventId: string) => {
    if (!userProfile) return;
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<{ isSubscribed: boolean }>('/events/reminder', {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      });
      setReminders((prev) => ({ ...prev, [eventId]: res.isSubscribed }));
      Alert.alert(
        res.isSubscribed ? '🔔 Recordatorio Activado' : '🔕 Recordatorio Cancelado',
        res.isSubscribed ? 'Te notificaremos cuando comience este evento.' : 'No recibirás notificaciones.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el recordatorio.');
    }
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'KARAOKE': return '🎤';
      case 'PK': return '⚔️';
      case 'TRIVIA': return '🧠';
      case 'TALENT': return '⭐';
      default: return '🎉';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🎉 Eventos PartyLive"
        showWallet={true}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {/* Category Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.tabBtn, selectedCategory === cat && styles.tabActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.tabText, selectedCategory === cat && styles.tabTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando eventos programados...</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyTitle}>No hay eventos en esta categoría</Text>
              <Text style={styles.emptySub}>Mantente atento a los eventos especiales de PartyLive.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const hasReminder = reminders[item.id] || false;
            return (
              <View style={styles.card}>
                <View style={styles.bannerRow}>
                  <Text style={styles.categoryEmoji}>{getCategoryEmoji(item.category)}</Text>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{item.category}</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <Text style={styles.eventHost}>🎙️ Organiza: {item.hostName || 'Host PartyLive'}</Text>
                  <Text style={styles.eventDesc}>{item.description}</Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.reminderBtn, hasReminder && styles.reminderActive]}
                      onPress={() => handleToggleReminder(item.id)}
                    >
                      <Text style={styles.reminderBtnText}>
                        {hasReminder ? '🔕 Cancelar' : '🔔 Avisarme'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 12,
  },
  tabContainer: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: '#26203D',
  },
  tabScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E1B30',
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#1E1B30',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#342D54',
    overflow: 'hidden',
  },
  bannerRow: {
    height: 70,
    backgroundColor: '#26203D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  categoryEmoji: {
    fontSize: 36,
  },
  categoryTag: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.accent,
  },
  cardBody: {
    padding: spacing.md,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  eventHost: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 4,
  },
  eventDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
  actionRow: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  reminderBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reminderActive: {
    backgroundColor: '#342D54',
  },
  reminderBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 11,
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
