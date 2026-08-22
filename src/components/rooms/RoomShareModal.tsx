import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Share,
  ToastAndroid,
  Platform,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { Room } from '../../types';

interface RoomShareModalProps {
  visible: boolean;
  onClose: () => void;
  room?: Room | null;
  roomId: string;
}

export const RoomShareModal: React.FC<RoomShareModalProps> = ({
  visible,
  onClose,
  room,
  roomId,
}) => {
  const [copied, setCopied] = useState(false);

  const roomTitle = room?.title || 'Sala de Voz';
  const shareUrl = `https://partylive.app/rooms/${roomId}`;
  const shareMessage = `🎉 ¡Únete a mi sala de voz "${roomTitle}" en PartyLive!\n\n🆔 Código de sala: ${roomId}\n🔗 Enlace: ${shareUrl}`;

  const handleWhatsAppShare = async () => {
    try {
      const url = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`);
      }
    } catch (err) {
      await Share.share({ message: shareMessage, title: roomTitle });
    }
  };

  const handleMessengerShare = async () => {
    try {
      const url = `fb-messenger://share?link=${encodeURIComponent(shareUrl)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Share.share({ message: shareMessage, title: roomTitle });
      }
    } catch (err) {
      await Share.share({ message: shareMessage, title: roomTitle });
    }
  };

  const handleTelegramShare = async () => {
    try {
      const url = `tg://msg?text=${encodeURIComponent(shareMessage)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(roomTitle)}`);
      }
    } catch (err) {
      await Share.share({ message: shareMessage, title: roomTitle });
    }
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: shareMessage,
        title: roomTitle,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await Share.share({
        message: shareUrl,
        title: `Enlace de la sala ${roomTitle}`,
      });
      setCopied(true);
      if (Platform.OS === 'android') {
        ToastAndroid.show('¡Enlace listo para compartir!', ToastAndroid.SHORT);
      }
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.warn('Copy link error:', err);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>🎉 Invitar amigos a la Sala</Text>
            <Text style={styles.roomSubtitle} numberOfLines={1}>
              {roomTitle}
            </Text>
          </View>

          {/* Room ID Badge */}
          <View style={styles.roomIdBox}>
            <Text style={styles.roomIdLabel}>ID de la sala:</Text>
            <Text style={styles.roomIdValue}>{roomId.substring(0, 12)}</Text>
          </View>

          {/* Share Channels */}
          <View style={styles.channelsGrid}>
            {/* WhatsApp */}
            <TouchableOpacity style={styles.channelBtn} onPress={handleWhatsAppShare} activeOpacity={0.8}>
              <View style={[styles.channelIconCircle, { backgroundColor: '#25D366' }]}>
                <Text style={styles.channelEmoji}>💬</Text>
              </View>
              <Text style={styles.channelLabel}>WhatsApp</Text>
            </TouchableOpacity>

            {/* Messenger */}
            <TouchableOpacity style={styles.channelBtn} onPress={handleMessengerShare} activeOpacity={0.8}>
              <View style={[styles.channelIconCircle, { backgroundColor: '#0084FF' }]}>
                <Text style={styles.channelEmoji}>⚡</Text>
              </View>
              <Text style={styles.channelLabel}>Messenger</Text>
            </TouchableOpacity>

            {/* Telegram */}
            <TouchableOpacity style={styles.channelBtn} onPress={handleTelegramShare} activeOpacity={0.8}>
              <View style={[styles.channelIconCircle, { backgroundColor: '#229ED9' }]}>
                <Text style={styles.channelEmoji}>✈️</Text>
              </View>
              <Text style={styles.channelLabel}>Telegram</Text>
            </TouchableOpacity>

            {/* Copiar Enlace */}
            <TouchableOpacity style={styles.channelBtn} onPress={handleCopyLink} activeOpacity={0.8}>
              <View style={[styles.channelIconCircle, { backgroundColor: '#7C4DFF' }]}>
                <Text style={styles.channelEmoji}>🔗</Text>
              </View>
              <Text style={styles.channelLabel}>{copied ? '¡Listo!' : 'Copiar Link'}</Text>
            </TouchableOpacity>
          </View>

          {/* Native Share button */}
          <TouchableOpacity style={styles.moreShareBtn} onPress={handleNativeShare} activeOpacity={0.8}>
            <Text style={styles.moreShareText}>📲 Más opciones de compartir...</Text>
          </TouchableOpacity>

          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1B30',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#3A3359',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#4E4670',
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
  },
  roomSubtitle: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  roomIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151221',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#292440',
    gap: 8,
  },
  roomIdLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  roomIdValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00E5FF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  channelsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  channelBtn: {
    alignItems: 'center',
    width: 72,
  },
  channelIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  channelEmoji: {
    fontSize: 24,
  },
  channelLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  moreShareBtn: {
    backgroundColor: '#292440',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#3D355F',
  },
  moreShareText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
