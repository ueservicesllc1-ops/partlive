import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { Gift } from '../../types';
import { getActiveGifts } from '../../services/firebase/firestore/giftsService';
import { useWallet } from '../../hooks/useWallet';
import { apiFetch } from '../../services/api/apiClient';
import { GiftReceiverSelector, Receiver } from './GiftReceiverSelector';
import { GiftCatalogTab } from './GiftCatalogTab';
import { DiamondPackagesTab } from './DiamondPackagesTab';
import { WalletBalanceTab } from './WalletBalanceTab';

interface GiftStoreModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: 'room' | 'live' | 'game';
  targetId: string;
  receivers: Receiver[];
  defaultReceiverId?: string;
  onGiftSent?: (giftEvent: any) => void;
  onGoToPayout?: () => void;
}

type TabType = 'gifts' | 'buy' | 'balance';

export const GiftStoreModal: React.FC<GiftStoreModalProps> = ({
  visible,
  onClose,
  targetType,
  targetId,
  receivers,
  defaultReceiverId,
  onGiftSent,
  onGoToPayout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('gifts');
  
  // Wallet hook for diamond packages and balances
  const { wallet, diamondPackages, refresh, loading: walletLoading } = useWallet();

  // Gift catalog state
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  
  // Receiver state
  const [selectedReceiver, setSelectedReceiver] = useState<Receiver | null>(null);
  
  // Gift quantity state
  const [quantity, setQuantity] = useState(1);
  const [sending, setSending] = useState(false);

  // 1. Fetch gifts on mount/visible
  useEffect(() => {
    if (visible) {
      setLoadingGifts(true);
      getActiveGifts()
        .then((data) => {
          setGifts(data);
          if (data.length > 0 && !selectedGift) {
            setSelectedGift(data[0]);
          }
        })
        .catch((err) => console.error('[GiftStoreModal] Error loading gifts:', err))
        .finally(() => setLoadingGifts(false));
      
      // Auto-refresh wallet state
      refresh().catch((err) => console.error('[GiftStoreModal] Error refreshing wallet:', err));
    }
  }, [visible]);

  // 2. Manage default receiver selection
  useEffect(() => {
    if (visible && receivers.length > 0) {
      if (defaultReceiverId) {
        const matching = receivers.find((r) => r.userId === defaultReceiverId);
        if (matching) {
          setSelectedReceiver(matching);
          return;
        }
      }
      // Fallback to first receiver
      setSelectedReceiver(receivers[0]);
    } else {
      setSelectedReceiver(null);
    }
  }, [visible, receivers, defaultReceiverId]);

  // 3. Gift Send handler
  const handleSendGift = async () => {
    if (!selectedGift) {
      Alert.alert('Selecciona un Regalo', 'Por favor selecciona un regalo para continuar.');
      return;
    }
    if (!selectedReceiver) {
      Alert.alert('Selecciona un Destinatario', 'Debes elegir a quién enviar el regalo.');
      return;
    }

    const cost = selectedGift.priceDiamonds * quantity;
    if (!wallet || wallet.diamonds < cost) {
      Alert.alert(
        'Diamantes Insuficientes',
        `Necesitas 💎 ${cost} diamantes pero solo tienes 💎 ${wallet?.diamonds ?? 0}. ¿Quieres comprar más?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Comprar Diamantes', onPress: () => setActiveTab('buy') },
        ]
      );
      return;
    }

    setSending(true);
    try {
      const response: any = await apiFetch('/gifts/send', {
        method: 'POST',
        body: JSON.stringify({
          targetType,
          targetId,
          receiverId: selectedReceiver.userId,
          giftId: selectedGift.id,
          quantity,
        }),
      });

      if (response && response.success) {
        Alert.alert(
          '¡Regalo Enviado!',
          `Has enviado ${quantity}x ${selectedGift.name} a ${selectedReceiver.displayName} con éxito.`
        );
        
        // Trigger callback for animation/chat notification
        if (onGiftSent && response.giftEvent) {
          onGiftSent(response.giftEvent);
        }

        // Refresh wallet state to show updated balance
        await refresh();
        
        // Close modal
        onClose();
      } else {
        throw new Error(response?.error || 'No se pudo procesar la transacción.');
      }
    } catch (err: any) {
      console.error('[GiftStoreModal] Error sending gift:', err);
      Alert.alert('Error al Enviar', err.message || 'Ocurrió un error en el servidor al enviar el regalo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tienda de Regalos</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Selection */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'gifts' && styles.tabActive]}
              onPress={() => setActiveTab('gifts')}
            >
              <Text style={[styles.tabText, activeTab === 'gifts' && styles.tabTextActive]}>
                🎁 Regalos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'buy' && styles.tabActive]}
              onPress={() => setActiveTab('buy')}
            >
              <Text style={[styles.tabText, activeTab === 'buy' && styles.tabTextActive]}>
                💎 Comprar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'balance' && styles.tabActive]}
              onPress={() => setActiveTab('balance')}
            >
              <Text style={[styles.tabText, activeTab === 'balance' && styles.tabTextActive]}>
                👛 Mi Saldo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body Content based on active tab */}
          <View style={styles.body}>
            {activeTab === 'gifts' && (
              <View style={styles.tabContent}>
                <GiftReceiverSelector
                  receivers={receivers}
                  selectedReceiver={selectedReceiver}
                  onSelectReceiver={setSelectedReceiver}
                />
                
                <GiftCatalogTab
                  gifts={gifts}
                  loading={loadingGifts}
                  selectedGift={selectedGift}
                  onSelectGift={setSelectedGift}
                  quantity={quantity}
                  onChangeQuantity={setQuantity}
                />
              </View>
            )}

            {activeTab === 'buy' && (
              <DiamondPackagesTab packages={diamondPackages} />
            )}

            {activeTab === 'balance' && (
              <WalletBalanceTab
                wallet={wallet}
                onRefresh={refresh}
                onGoToPayout={onGoToPayout}
              />
            )}
          </View>

          {/* Footer (Only for Gifts Tab) */}
          {activeTab === 'gifts' && (
            <View style={styles.footer}>
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Tu Saldo:</Text>
                <Text style={styles.balanceValue}>
                  💎 {wallet?.diamonds ?? 0}
                </Text>
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
                  <ActivityIndicator color="#0B0813" size="small" />
                ) : (
                  <Text style={styles.sendBtnText}>
                    Enviar {selectedGift ? `(💎 ${selectedGift.priceDiamonds * quantity})` : ''}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...textPresets.h3,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  closeIcon: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 4,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: 'rgba(138, 79, 255, 0.2)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  body: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceLabel: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontWeight: '600',
  },
  balanceValue: {
    ...textPresets.body,
    fontWeight: '800',
    color: colors.text,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(41, 36, 64, 0.6)',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnText: {
    color: '#0B0813',
    fontSize: 12,
    fontWeight: '900',
  },
});
