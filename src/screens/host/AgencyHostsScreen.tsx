import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing } from '../../theme';
import { agencyApi } from '../../services/api/agencyApi';
import firestore from '@react-native-firebase/firestore';

export const AgencyHostsScreen = ({ route, navigation }: any) => {
  const { agencyId } = route.params || {};
  const [hosts, setHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteId, setInviteId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadHosts = async () => {
    try {
      setLoading(true);
      const snap = await firestore()
        .collection('agencyHosts')
        .where('agencyId', '==', agencyId)
        .where('status', '==', 'active')
        .get();

      const list = snap.docs.map(doc => doc.data());
      
      // Fetch details of hosts
      const detailedHosts: any[] = [];
      for (const link of list) {
        const uDoc = await firestore().collection('users').doc(link.hostId).get();
        if (uDoc.exists()) {
          detailedHosts.push({
            id: link.hostId,
            displayName: uDoc.data()?.displayName || uDoc.data()?.username || 'Host',
            email: uDoc.data()?.email || '',
            photoURL: uDoc.data()?.photoURL || '',
          });
        }
      }
      setHosts(detailedHosts);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron cargar los hosts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agencyId) loadHosts();
  }, [agencyId]);

  const handleInvite = async () => {
    if (!inviteId.trim()) return;
    try {
      setActionLoading(true);
      await agencyApi.addHost(inviteId.trim());
      Alert.alert('Éxito', 'Host vinculado correctamente.');
      setInviteId('');
      loadHosts();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al vincular el host.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (hostId: string, hostName: string) => {
    Alert.alert(
      'Remover Host',
      `¿Estás seguro de que quieres remover a ${hostName} de tu agencia?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await agencyApi.removeHost(hostId);
              loadHosts();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Error al remover el host.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Administrar Hosts</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.inviteBox}>
        <Text style={styles.sectionTitle}>Vincular Nuevo Host</Text>
        <View style={styles.inviteRow}>
          <TextInput
            style={styles.input}
            value={inviteId}
            onChangeText={setInviteId}
            placeholder="Introduce la ID del Host..."
            placeholderTextColor={colors.textDark}
          />
          <TouchableOpacity
            style={[styles.inviteBtn, actionLoading && styles.disabled]}
            onPress={handleInvite}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.inviteBtnText}>Vincular</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={hosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyText}>No tienes hosts asociados actualmente.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={styles.itemDetails}>
                <Text style={styles.hostName}>{item.displayName}</Text>
                <Text style={styles.hostIdText} numberOfLines={1}>ID: {item.id}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(item.id, item.displayName)}
              >
                <Text style={styles.removeBtnText}>Desvincular</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
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
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  inviteBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  inviteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 13,
  },
  inviteBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    opacity: 0.6,
  },
  inviteBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  emptyWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  itemDetails: {
    flex: 1,
    marginRight: spacing.md,
  },
  hostName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  hostIdText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  removeBtn: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
  },
  removeBtnText: {
    color: colors.error,
    fontSize: 11,
    fontWeight: 'bold',
  },
});
export default AgencyHostsScreen;
