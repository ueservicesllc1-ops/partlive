import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../constants/firestoreCollections';
import { colors, spacing, textPresets } from '../theme';
import { Header } from '../components/Header';
import { MainHeader } from '../components/navigation/MainHeader';
import { useRoomsList } from '../hooks/useRoomsList';
import { RoomCard } from '../components/rooms/RoomCard';
import { MAIN_ROUTES } from '../app/routes';
import { useAuth } from '../store/AuthContext';
import { EnterRoomPasswordModal } from '../components/rooms/EnterRoomPasswordModal';
import { RequestRoomAccessModal } from '../components/rooms/RequestRoomAccessModal';
import { BannedFromRoomMessage } from '../components/rooms/BannedFromRoomMessage';
import { InviteOnlyMessage } from '../components/rooms/InviteOnlyMessage';
import { Room } from '../types';

const CATEGORIES = ['Popular', 'Música', 'Fiesta', 'Juegos', 'Karaoke', 'Amistad', 'Debate'];

export const RoomsScreen = ({ navigation }: any) => {
  const {
    rooms,
    loading,
    refreshing,
    error,
    selectedCategory,
    searchQuery,
    refresh,
    setCategory,
    setSearchQuery,
  } = useRoomsList();

  const { user } = useAuth();
  const [myRoom, setMyRoom] = useState<Room | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [banMsg, setBanMsg] = useState('');
  const [validationLoading, setValidationLoading] = useState(false);

  useEffect(() => {
    if (!user || user.uid === 'guest_user') {
      setMyRoom(null);
      return;
    }
    const unsubscribe = firestore()
      .collection(FirestoreCollections.ROOMS)
      .where('ownerId', '==', user.uid)
      .limit(1)
      .onSnapshot(
        snapshot => {
          if (snapshot && !snapshot.empty) {
            const doc = snapshot.docs[0];
            setMyRoom({ id: doc.id, ...doc.data() } as Room);
          } else {
            setMyRoom(null);
          }
        },
        err => {
          console.error('Error listening to my room:', err);
        }
      );
    return () => unsubscribe();
  }, [user]);

  // Backend base URL - falls back gracefully if backend not running
  const BACKEND_URL = 'http://192.168.1.240:4000';

  const checkRoomAccess = async (roomId: string, password?: string) => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes estar autenticado para entrar a una sala.');
      return;
    }
    setValidationLoading(true);

    // Add a 3-second timeout for the backend fetch to prevent hanging on physical devices
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/can-enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const resData = await response.json();
      setValidationLoading(false);

      if (resData.canEnter) {
        setPasswordModalVisible(false);
        navigation.navigate(MAIN_ROUTES.ROOM_DETAILS, { roomId });
      } else {
        setSelectedRoomId(roomId);
        if (resData.reason === 'password_required' || resData.reason === 'wrong_password') {
          setPasswordModalVisible(true);
        } else if (resData.reason === 'approval_required') {
          setRequestModalVisible(true);
        } else if (resData.reason === 'invite_only') {
          setInviteModalVisible(true);
        } else if (resData.reason === 'banned') {
          setBanMsg(resData.message || 'Estás bloqueado de esta sala.');
          setBanModalVisible(true);
        }
      }
    } catch (_err) {
      clearTimeout(timeoutId);
      setValidationLoading(false);
      // Fallback: navigate directly if backend not running or unreachable (dev mode)
      navigation.navigate(MAIN_ROUTES.ROOM_DETAILS, { roomId });
    }
  };

  const handleRequestAccess = async () => {
    if (!selectedRoomId || !user) return;
    setValidationLoading(true);
    try {
      await fetch(`${BACKEND_URL}/api/rooms/${selectedRoomId}/access/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || 'Usuario',
          userPhotoURL: user.photoURL || '',
        }),
      });
      setValidationLoading(false);
      setRequestModalVisible(false);
      Alert.alert('Solicitud Enviada', 'Espera a que el host apruebe tu acceso.');
    } catch (_err) {
      setValidationLoading(false);
      Alert.alert('Error', 'No se pudo enviar la solicitud.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <MainHeader
        title="Salas de Voz"
        onSearchPress={() => navigation.navigate(MAIN_ROUTES.SEARCH)}
        onNotificationsPress={() => navigation.navigate(MAIN_ROUTES.NOTIFICATIONS)}
        onWalletPress={() => navigation.navigate(MAIN_ROUTES.WALLET)}
        onMessagesPress={() => navigation.navigate(MAIN_ROUTES.PRIVATE_CONVERSATIONS)}
      />

      <Header
        title="Salas de Voz 🎙️"
        subtitle="Entra, habla y comparte momentos increíbles"
        rightComponent={
          <TouchableOpacity
            style={styles.createRoomHeaderBtn}
            onPress={() => navigation.navigate(MAIN_ROUTES.CREATE_ROOM)}
            activeOpacity={0.8}
          >
            <Text style={styles.createRoomHeaderBtnText}>+ Crear</Text>
          </TouchableOpacity>
        }
      />

      {/* Text Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar sala, etiqueta o anfitrión..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Badges Filter */}
      <View style={{ height: 45, marginVertical: spacing.xs }}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryBadge,
                selectedCategory === item && styles.categoryBadgeActive,
              ]}
              onPress={() => setCategory(item)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item && styles.categoryTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Tarjeta de "Mi Sala" */}
      {myRoom && (
        <View style={styles.myRoomSection}>
          <Text style={styles.sectionHeader}>Mi Sala de Voz</Text>
          <View style={styles.myRoomCard}>
            <View style={styles.myRoomInfo}>
              <Text style={styles.myRoomEmoji}>
                {myRoom.category === 'music' ? '🎵' : myRoom.category === 'karaoke' ? '🎤' : '🎙️'}
              </Text>
              <View style={styles.myRoomTextContainer}>
                <Text style={styles.myRoomTitle} numberOfLines={1}>{myRoom.title}</Text>
                <Text style={styles.myRoomStatus}>
                  {myRoom.status === 'active' ? '🟢 Activa ahora' : '⚫ Inactiva'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.myRoomBtn,
                myRoom.status === 'active' ? styles.myRoomBtnActive : styles.myRoomBtnInactive
              ]}
              onPress={() => {
                if (myRoom.status === 'active') {
                  checkRoomAccess(myRoom.id);
                } else {
                  navigation.navigate(MAIN_ROUTES.CREATE_ROOM);
                }
              }}
            >
              <Text style={styles.myRoomBtnText}>
                {myRoom.status === 'active' ? 'Entrar' : 'Iniciar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* List / Loading / Error / Empty Fallback */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.infoText}>Cargando salas...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : rooms.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No hay salas activas en esta categoría.</Text>
              <TouchableOpacity
                style={styles.createBtnInline}
                onPress={() => navigation.navigate(MAIN_ROUTES.CREATE_ROOM)}
              >
                <Text style={styles.createBtnInlineText}>¡Sé el primero en crear una!</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <RoomCard
              room={item}
              onPress={() => checkRoomAccess(item.id)}
            />
          )}
        />
      )}

      <EnterRoomPasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        onSubmit={(pass) => checkRoomAccess(selectedRoomId!, pass)}
        loading={validationLoading}
      />

      <RequestRoomAccessModal
        visible={requestModalVisible}
        onClose={() => setRequestModalVisible(false)}
        onRequest={handleRequestAccess}
        loading={validationLoading}
      />

      <BannedFromRoomMessage
        visible={banModalVisible}
        onClose={() => setBanModalVisible(false)}
        message={banMsg}
      />

      <InviteOnlyMessage
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
      />

      {/* Floating Create Room Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate(MAIN_ROUTES.CREATE_ROOM)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  searchInput: {
    backgroundColor: '#1E1B30',
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#292440',
  },
  categoriesList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#1C192E',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292440',
  },
  categoryBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 90,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  infoText: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  errorText: {
    ...textPresets.bodySmall,
    color: '#FF1744',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  emptyText: {
    ...textPresets.bodyMedium,
    color: colors.textMuted,
    textAlign: 'center',
  },
  createBtnInline: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createBtnInlineText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: '#FFF',
    lineHeight: 30,
  },
  createRoomHeaderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRoomHeaderBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  myRoomSection: {
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  sectionHeader: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  myRoomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1B30',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary + '44',
  },
  myRoomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  myRoomEmoji: {
    fontSize: 28,
  },
  myRoomTextContainer: {
    flex: 1,
  },
  myRoomTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 'bold',
  },
  myRoomStatus: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  myRoomBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  myRoomBtnActive: {
    backgroundColor: colors.success,
  },
  myRoomBtnInactive: {
    backgroundColor: colors.primary,
  },
  myRoomBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
