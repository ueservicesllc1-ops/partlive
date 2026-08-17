import React, { useState, useEffect } from 'react';
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
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../store/AuthContext';

export const ClubsHomeScreen = ({ navigation }: any) => {
  const { userProfile } = useAuth();
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('clubs')
      .where('status', '==', 'active')
      .limit(30)
      .onSnapshot(
        (snap) => {
          if (!snap) return;
          const list = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setClubs(list);
          setLoading(false);
        },
        (err) => {
          console.error('[ClubsHomeScreen] Error listening to clubs:', err);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const handleCreateClub = () => {
    if (!userProfile) return;
    Alert.prompt(
      '🏰 Crear Nuevo Club VIP',
      'Ingresa el nombre de tu nuevo Club:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear',
          onPress: async (name?: string) => {
            if (!name || name.trim().length === 0) return;
            try {
              const { apiFetch } = await import('../../services/api/apiClient');
              await apiFetch('/clubs/create', {
                method: 'POST',
                body: JSON.stringify({
                  name: name.trim(),
                  description: 'Club oficial de PartyLive',
                }),
              });
              Alert.alert('¡Club Creado!', `El club "${name}" ha sido creado con éxito.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo crear el club.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="👑 Clubs VIP & Fan Clubs"
        showWallet={true}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      <View style={styles.createBanner}>
        <View style={styles.createCol}>
          <Text style={styles.createTitle}>¿Quieres liderar tu propia comunidad?</Text>
          <Text style={styles.createSub}>Crea un Club VIP o Fan Club Oficial</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateClub}>
          <Text style={styles.createBtnText}>+ Crear</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando Clubs VIP...</Text>
        </View>
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏰</Text>
              <Text style={styles.emptyTitle}>No hay Clubs VIP creados aún</Text>
              <Text style={styles.emptySub}>Sé el primero en fundar un Club VIP en PartyLive.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ClubDetails', { clubId: item.id })}
            >
              <View style={styles.iconBox}>
                <Text style={styles.iconEmoji}>{item.isHostFanClub ? '🎙️' : '🏰'}</Text>
              </View>
              <View style={styles.infoCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.clubName} numberOfLines={1}>{item.name}</Text>
                  {item.isHostFanClub && (
                    <View style={styles.fanBadge}>
                      <Text style={styles.fanText}>FAN CLUB</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.clubDesc} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.membersCount}>👥 {item.memberCount || 1} miembros</Text>
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
  createBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1B30',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  createCol: {
    flex: 1,
    marginRight: 10,
  },
  createTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  createSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  createBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#26203D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 22,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 6,
  },
  fanBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fanText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.accent,
  },
  clubDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  membersCount: {
    fontSize: 10,
    color: '#FFD700',
    marginTop: 4,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
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
