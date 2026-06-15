import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Gift, RoomMember, Wallet } from '../../types';
import { getActiveGifts } from '../../services/firebase/firestore/giftsService';
import { sendRoomGiftMessage } from '../../services/firebase/firestore/messagesService';
import { colors, spacing, textPresets } from '../../theme';
import { Avatar } from '../Avatar';
import { GIFT_WALLET_MODE } from '../../constants/giftConfig';
import { apiFetch } from '../../services/api/apiClient';
import firestore from '@react-native-firebase/firestore';
import { getRoomGiftEventsPath } from '../../constants/firestoreCollections';
import { sendLiveGift } from '../../services/firebase/firestore/liveGiftEventsService';

interface GiftCatalogModalProps {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  members: RoomMember[];
  currentUserId: string;
  currentMember: RoomMember | null;
  wallet: Wallet | null;
  isLive?: boolean;
}


export const GiftCatalogModal: React.FC<GiftCatalogModalProps> = ({
  visible,
  onClose,
  roomId,
  members,
  currentUserId,
  currentMember,
  wallet,
  isLive = false,
}) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [selectedReceiver, setSelectedReceiver] = useState<RoomMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // 1. Filter other active members to send gifts to
  const potentialReceivers = members.filter(m => m.userId !== currentUserId && !m.isKicked);

  // 2. Fetch active gifts
  useEffect(() => {
    if (visible) {
      setLoading(true);
      getActiveGifts()
        .then(setGifts)
        .catch(err => console.error('Error fetching active gifts:', err))
        .finally(() => setLoading(false));
    }
  }, [visible]);

  // Set default receiver if list not empty
  useEffect(() => {
    if (visible && potentialReceivers.length > 0 && !selectedReceiver) {
      setSelectedReceiver(potentialReceivers[0]);
    }
  }, [visible, potentialReceivers, selectedReceiver]);

  const handleSendGift = async () => {
    if (!selectedGift) {
      Alert.alert('Error', 'Selecciona un regalo.');
      return;
    }
    if (!selectedReceiver) {
      Alert.alert('Error', 'Selecciona un destinatario.');
      return;
    }

    setSending(true);

    try {
      const quantity = 1;
      const totalDiamonds = selectedGift.priceDiamonds * quantity;
      const totalBeans = selectedGift.beansValue * quantity;

      if (GIFT_WALLET_MODE === 'backend') {
        // Validation check client-side
        if (!wallet || wallet.diamonds < totalDiamonds) {
          Alert.alert('Diamantes Insuficientes', 'No tienes suficientes diamantes. Ve a la Billetera a recargar.');
          setSending(false);
          return;
        }

        if (isLive) {
          // Call secure live backend endpoint
          await apiFetch('/gifts/live/send', {
            method: 'POST',
            body: JSON.stringify({
              liveId: roomId,
              receiverId: selectedReceiver.userId,
              giftId: selectedGift.id,
              quantity,
            }),
          });
        } else {
          // Call secure room backend endpoint
          await apiFetch('/gifts/room/send', {
            method: 'POST',
            body: JSON.stringify({
              roomId,
              receiverId: selectedReceiver.userId,
              giftId: selectedGift.id,
              quantity,
            }),
          });
        }

        Alert.alert('Regalo Enviado', `Enviaste ${selectedGift.name} a ${selectedReceiver.displayName} con éxito.`);
      } else {
        // GIFT_WALLET_MODE === 'mock'
        if (isLive) {
          await sendLiveGift(
            roomId,
            { uid: currentUserId, displayName: currentMember?.displayName || 'Usuario' },
            { uid: selectedReceiver.userId, displayName: selectedReceiver.displayName },
            selectedGift,
            quantity
          );
        } else {
          // 1. Create giftEvent in room subcollection
          const eventRef = firestore().collection(getRoomGiftEventsPath(roomId)).doc();
          const giftEvent = {
            id: eventRef.id,
            giftId: selectedGift.id,
            giftName: selectedGift.name,
            giftIconUrl: selectedGift.iconUrl || '🎁',
            senderId: currentUserId,
            senderName: currentMember?.displayName || 'Usuario',
            receiverId: selectedReceiver.userId,
            receiverName: selectedReceiver.displayName,
            roomId,
            quantity,
            totalDiamonds,
            totalBeans,
            createdAt: firestore.FieldValue.serverTimestamp(),
          };
          await eventRef.set(giftEvent);

          // 2. Add System message to room messages
          await sendRoomGiftMessage(roomId, giftEvent);
        }

        Alert.alert('Regalo Enviado (Mock)', `Enviaste un regalo simulado: ${selectedGift.name} a ${selectedReceiver.displayName}.`);
      }


      onClose();
    } catch (err: any) {
      console.error('Error sending gift:', err);
      Alert.alert('Error', err.message || 'No se pudo enviar el regalo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Enviar Regalo</Text>
            {GIFT_WALLET_MODE === 'mock' && (
              <View style={styles.devBadge}>
                <Text style={styles.devBadgeText}>🛠️ Modo mock: no descuenta coins</Text>
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Receiver Selector */}
          <View style={styles.receiverSection}>
            <Text style={styles.sectionTitle}>Destinatario:</Text>
            {potentialReceivers.length === 0 ? (
              <Text style={styles.noReceiversText}>No hay otros miembros en la sala para regalar.</Text>
            ) : (
              <FlatList
                data={potentialReceivers}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.userId}
                contentContainerStyle={styles.receiversList}
                renderItem={({ item }) => {
                  const isSelected = selectedReceiver?.userId === item.userId;
                  return (
                    <TouchableOpacity
                      style={[styles.receiverCard, isSelected && styles.receiverCardActive]}
                      onPress={() => setSelectedReceiver(item)}
                    >
                      <Avatar source={item.photoURL} emoji="👤" size={36} />
                      <Text style={[styles.receiverName, isSelected && styles.receiverNameActive]} numberOfLines={1}>
                        {item.displayName.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          {/* Gifts Grid */}
          <View style={styles.giftsSection}>
            <Text style={styles.sectionTitle}>Regalos:</Text>
            {loading ? (
              <ActivityIndicator color={colors.accent} style={{ marginVertical: 30 }} />
            ) : (
              <FlatList
                data={gifts}
                numColumns={3}
                keyExtractor={item => item.id}
                columnWrapperStyle={styles.giftsRow}
                contentContainerStyle={styles.giftsGrid}
                renderItem={({ item }) => {
                  const isSelected = selectedGift?.id === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.giftItem, isSelected && styles.giftItemActive]}
                      onPress={() => setSelectedGift(item)}
                    >
                      <Text style={styles.giftIcon}>{item.iconUrl || '🎁'}</Text>
                      <Text style={styles.giftNameText} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.giftPrice}>💎 {item.priceDiamonds}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          {/* Bottom Bar: Wallet Balance & Send Button */}
          <View style={styles.footer}>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Tu Saldo:</Text>
              <Text style={styles.balanceValue}>💎 {wallet?.diamonds || 0}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!selectedGift || !selectedReceiver || sending) && styles.sendBtnDisabled,
              ]}
              disabled={!selectedGift || !selectedReceiver || sending}
              onPress={handleSendGift}
            >
              {sending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>Enviar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#1E1B30',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: '#292440',
    maxHeight: '80%',
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#292440',
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
  },
  devBadge: {
    backgroundColor: 'rgba(255, 235, 59, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#FFD54F',
  },
  devBadgeText: {
    fontSize: 9,
    color: '#FFD54F',
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeIcon: {
    fontSize: 16,
    color: colors.textMuted,
  },
  sectionTitle: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  receiverSection: {
    marginTop: spacing.md,
  },
  receiversList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  receiverCard: {
    width: 66,
    alignItems: 'center',
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#151221',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  receiverCardActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  receiverName: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  receiverNameActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  noReceiversText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  giftsSection: {
    marginTop: spacing.md,
    maxHeight: 300,
  },
  giftsGrid: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  giftsRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  giftItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#151221',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  giftItemActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(156, 39, 176, 0.08)',
  },
  giftIcon: {
    fontSize: 28,
  },
  giftNameText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: 'bold',
    marginTop: 4,
  },
  giftPrice: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#292440',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginRight: 6,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(41, 36, 64, 0.6)',
  },
  sendBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
