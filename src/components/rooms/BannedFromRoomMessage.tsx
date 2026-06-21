import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';

interface BannedFromRoomMessageProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

export const BannedFromRoomMessage: React.FC<BannedFromRoomMessageProps> = ({
  visible,
  onClose,
  message = 'Estás bloqueado de esta sala.',
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.emoji}>🚫</Text>
          <Text style={styles.title}>Acceso Denegado</Text>
          <Text style={styles.subtitle}>{message}</Text>
          <Text style={styles.info}>No puedes ingresar ni enviar mensajes en esta sala.</Text>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.background,
    borderColor: '#3a1e28',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 54,
    marginBottom: spacing.sm,
  },
  title: {
    ...textPresets.h3,
    color: '#FF4A4A',
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textPresets.body,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  info: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  closeBtn: {
    backgroundColor: '#3a1e28',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  closeText: {
    color: '#FF4A4A',
    fontWeight: 'bold',
  },
});
