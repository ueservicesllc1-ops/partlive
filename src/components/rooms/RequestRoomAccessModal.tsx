import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { Button } from '../Button';

interface RequestRoomAccessModalProps {
  visible: boolean;
  onClose: () => void;
  onRequest: () => void;
  loading?: boolean;
}

export const RequestRoomAccessModal: React.FC<RequestRoomAccessModalProps> = ({
  visible,
  onClose,
  onRequest,
  loading = false,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.emoji}>🔑</Text>
          <Text style={styles.title}>Solicitar Acceso</Text>
          <Text style={styles.subtitle}>
            Esta sala requiere la aprobación del host para que puedas entrar. ¿Quieres enviar una solicitud?
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} disabled={loading}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Button
              title={loading ? 'Enviando...' : 'Solicitar Entrada'}
              onPress={onRequest}
              disabled={loading}
              style={styles.submitBtn}
            />
          </View>
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
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
  },
});
