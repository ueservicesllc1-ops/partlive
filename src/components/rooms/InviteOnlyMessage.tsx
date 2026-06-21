import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';

interface InviteOnlyMessageProps {
  visible: boolean;
  onClose: () => void;
}

export const InviteOnlyMessage: React.FC<InviteOnlyMessageProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.emoji}>✉️</Text>
          <Text style={styles.title}>Solo Invitados</Text>
          <Text style={styles.subtitle}>
            Esta sala está configurada como 'Solo Invitados'. Necesitas recibir una invitación del host para poder unirte.
          </Text>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.background,
    borderColor: '#292440',
    borderWidth: 1,
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  closeBtn: {
    backgroundColor: '#1E1B30',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#292440',
  },
  closeText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
