import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image
} from 'react-native';
import { colors, spacing } from '../../theme';
import { getLiveStreams } from '../../services/firebase/firestore/livesService';
import { inviteHostToPk } from '../../services/api/pkApi';
import { LiveStream } from '../../types/live';

interface PkInviteModalProps {
  visible: boolean;
  onClose: () => void;
  fromLiveId: string;
  currentHostId: string;
  onInviteSent?: () => void;
}

export const PkInviteModal: React.FC<PkInviteModalProps> = ({
  visible,
  onClose,
  fromLiveId,
  currentHostId,
  onInviteSent,
}) => {
  const [loading, setLoading] = useState(false);
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);
  const [lives, setLives] = useState<LiveStream[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadActiveHosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const activeLives = await getLiveStreams();
      // Filter out self and any hosts already in a PK battle
      const available = activeLives.filter(
        (l) => l.hostId !== currentHostId && !l.isInPkBattle
      );
      setLives(available);
    } catch (err) {
      console.error(err);
      setError('Error al obtener hosts activos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadActiveHosts();
      setSearchQuery('');
      setError(null);
    }
  }, [visible]);

  const handleSendInvite = async (toHostId: string) => {
    try {
      setSendingInviteId(toHostId);
      setError(null);
      await inviteHostToPk(toHostId, fromLiveId, '¿Quieres iniciar una batalla PK 1vs1?');
      if (onInviteSent) onInviteSent();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al enviar la invitación.');
    } finally {
      setSendingInviteId(null);
    }
  };

  const filteredLives = lives.filter((l) =>
    l.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Invitar a Batalla PK</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TextInput
            placeholder="Buscar host..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />

          {loading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Buscando hosts activos...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredLives}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyWrapper}>
                  <Text style={styles.emptyText}>No hay otros hosts activos en este momento.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  {item.hostPhotoURL ? (
                    <Image source={{ uri: item.hostPhotoURL }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarLetter}>
                        {item.hostName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.itemDetails}>
                    <Text style={styles.hostName}>{item.hostName}</Text>
                    <Text style={styles.liveTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.inviteBtn}
                    onPress={() => handleSendInvite(item.hostId)}
                    disabled={sendingInviteId !== null}
                  >
                    {sendingInviteId === item.hostId ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <Text style={styles.inviteBtnText}>Desafiar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1E1B30',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '65%',
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#292440',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: 18,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 13,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontSize: 12,
  },
  listContent: {
    paddingBottom: spacing.xl,
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
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarLetter: {
    color: colors.text,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
  },
  hostName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  liveTitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  inviteBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
