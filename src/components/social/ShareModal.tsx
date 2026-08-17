import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';

interface ShareModalProps {
  visible: boolean;
  title: string;
  shareUrl: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  title,
  shareUrl,
  onClose,
}) => {
  const handleSharePlatform = async (platformName: string) => {
    try {
      await Share.share({
        message: `¡Mira esto en PartyLive!: ${title}\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo compartir.');
    } finally {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>📢 Compartir Contenido</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subText}>{title}</Text>

          <View style={styles.grid}>
            <TouchableOpacity style={styles.shareOption} onPress={() => handleSharePlatform('WhatsApp')}>
              <Text style={styles.optionEmoji}>💬</Text>
              <Text style={styles.optionLabel}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareOption} onPress={() => handleSharePlatform('Instagram')}>
              <Text style={styles.optionEmoji}>📸</Text>
              <Text style={styles.optionLabel}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareOption} onPress={() => handleSharePlatform('TikTok')}>
              <Text style={styles.optionEmoji}>🎵</Text>
              <Text style={styles.optionLabel}>TikTok</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareOption} onPress={() => handleSharePlatform('Enlace')}>
              <Text style={styles.optionEmoji}>🔗</Text>
              <Text style={styles.optionLabel}>Copiar Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#141124',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: '#26203D',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  subText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 10,
  },
  shareOption: {
    alignItems: 'center',
    gap: 6,
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionLabel: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
  },
});
