import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { Avatar } from '../Avatar';
import firestore from '@react-native-firebase/firestore';

interface PkHostSearchModalProps {
  visible: boolean;
  onClose: () => void;
  currentHostId: string;
  fromLiveId: string;
  onInviteSent?: () => void;
}

interface OnlineHost {
  id: string;
  displayName: string;
  photoURL?: string;
  liveId: string;
  title: string;
}

export const PkHostSearchModal: React.FC<PkHostSearchModalProps> = ({
  visible,
  onClose,
  currentHostId,
  fromLiveId,
  onInviteSent,
}) => {
  const [hosts, setHosts] = useState<OnlineHost[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(300); // Default 5 mins

  useEffect(() => {
    if (visible) {
      setLoading(true);
      firestore()
        .collection('lives')
        .where('status', '==', 'live')
        .get()
        .then((snap) => {
          const list: OnlineHost[] = [];
          snap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.hostId !== currentHostId && !data.isInPkBattle) {
              list.push({
                id: data.hostId,
                displayName: data.hostName || data.title || 'Anfitrión',
                photoURL: data.hostAvatar || '',
                liveId: doc.id,
                title: data.title || 'Live Stream',
              });
            }
          });
          setHosts(list);
        })
        .catch((err) => console.error('[PkHostSearchModal] Error fetching active hosts:', err))
        .finally(() => setLoading(false));
    }
  }, [visible, currentHostId]);

  const handleInvite = async (targetHost: OnlineHost) => {
    setSendingId(targetHost.id);
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      await apiFetch('/pk/invite', {
        method: 'POST',
        body: JSON.stringify({
          toHostId: targetHost.id,
          fromLiveId,
          durationSeconds: selectedDuration,
        }),
      });

      Alert.alert(
        '⚔️ Desafío Enviado',
        `Has enviado la invitación de duelo PK a ${targetHost.displayName}. Esperando su respuesta.`
      );
      if (onInviteSent) onInviteSent();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo enviar la invitación PK.');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>⚔️ Desafío PK 1vs1 — Buscar Anfitrión</Text>

          {/* Duration Selector */}
          <View style={styles.durationRow}>
            <Text style={styles.durationLabel}>Duración del Duelo:</Text>
            <View style={styles.durationBtns}>
              {[60, 180, 300, 600].map((dur) => {
                const label = `${dur / 60}m`;
                const isSelected = selectedDuration === dur;
                return (
                  <TouchableOpacity
                    key={dur}
                    style={[styles.durBtn, isSelected && styles.durBtnActive]}
                    onPress={() => setSelectedDuration(dur)}
                  >
                    <Text style={[styles.durText, isSelected && styles.durTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={styles.loadingText}>Buscando anfitriones en vivo...</Text>
            </View>
          ) : hosts.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                No hay anfitriones disponibles en este momento para desafiar.
              </Text>
            </View>
          ) : (
            <FlatList
              data={hosts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={styles.hostRow}>
                  <Avatar source={item.photoURL} emoji="🎙️" size={42} />
                  <View style={styles.infoCol}>
                    <Text style={styles.hostName}>{item.displayName}</Text>
                    <Text style={styles.liveTitle} numberOfLines={1}>{item.title}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.challengeBtn}
                    onPress={() => handleInvite(item)}
                    disabled={sendingId === item.id}
                  >
                    {sendingId === item.id ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.challengeText}>Desafiar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1E1B30',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '80%',
    borderTopWidth: 1.5,
    borderColor: '#342D54',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141124',
    padding: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  durationLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  durationBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  durBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#26203D',
  },
  durBtnActive: {
    backgroundColor: colors.accent,
  },
  durText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  durTextActive: {
    color: '#FFF',
  },
  center: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  list: {
    gap: 8,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141124',
    padding: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  infoCol: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  hostName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  liveTitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  challengeBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  challengeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeBtn: {
    marginTop: spacing.md,
    paddingVertical: 12,
    backgroundColor: '#2A2542',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeText: {
    color: colors.textMuted,
    fontWeight: 'bold',
  },
});
