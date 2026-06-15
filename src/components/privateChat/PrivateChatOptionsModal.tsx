import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { colors, spacing } from '../../theme';

interface PrivateChatOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onArchive: () => void;
  onBlock: () => void;
  onReport: () => void;
}

export const PrivateChatOptionsModal: React.FC<PrivateChatOptionsModalProps> = ({
  visible,
  onClose,
  isMuted,
  onToggleMute,
  onArchive,
  onBlock,
  onReport,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onToggleMute();
              onClose();
            }}
          >
            <Text style={styles.menuText}>
              {isMuted ? '🔊 Desactivar silencio' : '🔕 Silenciar chat'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onArchive();
              onClose();
            }}
          >
            <Text style={styles.menuText}>📦 Archivar conversación</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              onReport();
              onClose();
            }}
          >
            <Text style={styles.menuText}>⚠️ Reportar chat</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.menuItem, styles.dangerItem]}
            onPress={() => {
              onBlock();
              onClose();
            }}
          >
            <Text style={styles.dangerText}>🚫 Bloquear usuario</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: spacing.xs,
    width: 220,
    marginTop: 60,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuText: {
    color: colors.text,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  dangerItem: {
    backgroundColor: 'rgba(255, 23, 68, 0.05)',
  },
  dangerText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
