import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'follow', message: 'Juan Pérez ha comenzado a seguirte.', time: 'Hace 5m' },
  { id: '2', type: 'gift', message: 'Recibiste un "Rosa" en tu última sala.', time: 'Hace 1h' },
  { id: '3', type: 'live', message: 'Tu host favorito está en vivo.', time: 'Hace 2h' },
];

export const NotificationsScreen = ({ navigation }: any) => {
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.notificationItem}>
      <Text style={styles.icon}>{item.type === 'follow' ? '👤' : item.type === 'gift' ? '🎁' : '📺'}</Text>
      <View style={styles.content}>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader 
        title="Notificaciones" 
        showNotifications={false} 
        onSearchPress={() => navigation.navigate('Search')}
        onWalletPress={() => navigation.navigate('Wallet')}
      />
      
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recientes</Text>
        <TouchableOpacity>
          <Text style={styles.markReadText}>Marcar leídas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No tienes notificaciones aún.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  sectionTitle: { ...textPresets.h3, color: colors.text },
  markReadText: { ...textPresets.bodySmall, color: colors.primary, fontWeight: 'bold' },
  list: { paddingBottom: spacing.xxl },
  notificationItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  icon: { fontSize: 24, marginRight: spacing.md },
  content: { flex: 1 },
  message: { ...textPresets.bodyMedium, color: colors.text },
  time: { ...textPresets.caption, color: colors.textMuted, marginTop: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { ...textPresets.bodyMedium, color: colors.textMuted },
});
