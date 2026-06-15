import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';
import { useGameInvites } from '../../hooks/useGameInvites';
import { MAIN_ROUTES } from '../../app/routes';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationItem } from '../../components/notifications/NotificationItem';
import { NotificationEmptyState } from '../../components/notifications/NotificationEmptyState';
import { NotificationFilters } from '../../components/notifications/NotificationFilters';

export const NotificationsScreen = ({ navigation }: any) => {
  const { pendingInvites } = useGameInvites();
  const { notifications, unreadCount, loading, markAllRead, handleNotificationAction, refreshing, refresh } = useNotifications();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return n.status === 'unread';
    if (activeFilter === 'system') return n.type === 'system' || n.type === 'moderation';
    if (activeFilter === 'game') return n.type === 'game_invite';
    if (activeFilter === 'gift') return n.type === 'gift_received';
    return true;
  });

  const renderGameInvitesBanner = () => {
    if (pendingInvites.length === 0) return null;
    return (
      <TouchableOpacity
        style={styles.invitesBanner}
        onPress={() => navigation.navigate(MAIN_ROUTES.GAME_INVITES)}
      >
        <Text style={styles.invitesIcon}>🎮</Text>
        <View style={styles.invitesContent}>
          <Text style={styles.invitesTitle}>Invitaciones de Juego</Text>
          <Text style={styles.invitesText}>
            Tienes {pendingInvites.length} {pendingInvites.length === 1 ? 'invitación' : 'invitaciones'} de juego pendiente{pendingInvites.length === 1 ? '' : 's'}.
          </Text>
        </View>
        <Text style={styles.invitesArrow}>→</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader 
        title="Notificaciones" 
        showNotifications={false} 
        onSearchPress={() => navigation.navigate('Search')}
        onWalletPress={() => navigation.navigate('Wallet')}
      />

      {renderGameInvitesBanner()}

      <View style={styles.actionHeader}>
        <View style={styles.badgeRow}>
          <Text style={styles.sectionTitle}>Entrada</Text>
          {unreadCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRightActions}>
          <TouchableOpacity onPress={() => navigation.navigate(MAIN_ROUTES.SETTINGS)} style={styles.settingsBtn}>
            <Text style={styles.settingsText}>⚙️ Preferencias</Text>
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markReadText}>Marcar leídas</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <NotificationFilters activeFilter={activeFilter} onChange={setActiveFilter} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handleNotificationAction(item)}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={NotificationEmptyState}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { ...textPresets.h3, color: colors.text },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsBtn: {
    backgroundColor: '#1E1B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292440',
  },
  settingsText: {
    fontSize: 11,
    color: colors.text,
  },
  markReadText: { ...textPresets.bodySmall, color: colors.primary, fontWeight: 'bold' },
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  invitesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  invitesIcon: { fontSize: 24 },
  invitesContent: { flex: 1 },
  invitesTitle: { ...textPresets.bodyMedium, color: colors.text, fontWeight: '700' },
  invitesText: { ...textPresets.caption, color: colors.textMuted },
  invitesArrow: { fontSize: 18, color: colors.primary, fontWeight: 'bold' },
});
