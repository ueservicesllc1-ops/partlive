import React from 'react';
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
import { colors, spacing, textPresets } from '../../theme';
import { useGameInvites } from '../../hooks/useGameInvites';
import { MAIN_ROUTES } from '../../app/routes';

export const GameInvitesScreen = ({ navigation }: any) => {
  const { pendingInvites, loading, error, acceptInvite, declineInvite, refresh } = useGameInvites();

  const handleAccept = async (inviteId: string, gameSlug: string) => {
    try {
      const sessionId = await acceptInvite(inviteId);
      navigation.navigate(MAIN_ROUTES.GAME_SESSION, {
        sessionId,
        gameSlug,
        gameTitle: gameSlug.toUpperCase(),
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo aceptar la invitación.');
    }
  };

  const handleDecline = async (inviteId: string) => {
    try {
      await declineInvite(inviteId);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo rechazar la invitación.');
    }
  };

  const formatTimeRemaining = (expiresAt: any) => {
    if (!expiresAt) return '';
    const now = Date.now();
    const expires = expiresAt.toMillis ? expiresAt.toMillis() : new Date(expiresAt).getTime();
    const diffMin = Math.max(0, Math.floor((expires - now) / 60000));
    
    if (diffMin <= 0) return 'Expirando ahora';
    return `Expira en ${diffMin} min`;
  };

  const renderInviteItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.gameIcon}>🎮</Text>
          <View style={styles.headerText}>
            <Text style={styles.gameTitle}>{item.gameTitle || item.gameId.toUpperCase()}</Text>
            <Text style={styles.expiryText}>{formatTimeRemaining(item.expiresAt)}</Text>
          </View>
        </View>

        <Text style={styles.inviteText}>
          <Text style={styles.displayName}>{item.fromDisplayName}</Text> te invita a jugar.
        </Text>

        {item.message ? <Text style={styles.messageText}>"{item.message}"</Text> : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.declineBtn]}
            onPress={() => handleDecline(item.id)}
          >
            <Text style={styles.declineBtnText}>Rechazar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.acceptBtn]}
            onPress={() => handleAccept(item.id, item.gameId)}
          >
            <Text style={styles.acceptBtnText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invitaciones de Juego</Text>
        <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando invitaciones...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : pendingInvites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✉️</Text>
          <Text style={styles.emptyText}>No tienes invitaciones pendientes</Text>
          <Text style={styles.emptySubtext}>
            Cuando tus amigos te inviten a una partida de juego, aparecerá aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pendingInvites}
          renderItem={renderInviteItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  backIcon: { fontSize: 24, color: colors.text, fontWeight: 'bold' },
  headerTitle: { ...textPresets.h3, color: colors.text },
  refreshBtn: { padding: spacing.xs },
  refreshIcon: { fontSize: 24, color: colors.textMuted },
  
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { ...textPresets.bodyMedium, color: colors.textMuted },
  
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  errorText: { ...textPresets.bodyMedium, color: colors.error, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: spacing.xl },
  retryBtnText: { ...textPresets.caption, color: '#FFF', fontWeight: '700' },
  
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.sm },
  emptyIcon: { fontSize: 64, marginBottom: spacing.sm },
  emptyText: { ...textPresets.h3, color: colors.text, textAlign: 'center' },
  emptySubtext: { ...textPresets.bodyMedium, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl },
  
  listContent: { padding: spacing.xl, gap: spacing.lg },
  card: {
    backgroundColor: '#1E1935',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#2D274A',
  },
  cardHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  gameIcon: { fontSize: 32 },
  headerText: { flex: 1 },
  gameTitle: { ...textPresets.bodyMedium, color: colors.text, fontWeight: '700' },
  expiryText: { ...textPresets.caption, color: colors.warning, fontWeight: '600' },
  
  inviteText: { ...textPresets.bodyMedium, color: colors.text, marginBottom: spacing.md },
  displayName: { fontWeight: '700', color: colors.accent },
  messageText: {
    ...textPresets.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    backgroundColor: '#0B0813',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  
  actions: { flexDirection: 'row', gap: spacing.md },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { backgroundColor: '#2D274A' },
  declineBtnText: { ...textPresets.bodyMedium, color: colors.textMuted, fontWeight: '700' },
  acceptBtn: { backgroundColor: colors.primary },
  acceptBtnText: { ...textPresets.bodyMedium, color: '#FFF', fontWeight: '700' },
});
