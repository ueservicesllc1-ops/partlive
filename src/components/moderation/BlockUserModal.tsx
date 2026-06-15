import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { blockUser, unblockUser } from '../../services/firebase/firestore/blocksService';
import { colors, spacing, textPresets } from '../../theme';

interface BlockUserModalProps {
  visible: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  isBlocked: boolean;
  onSuccess?: (wasBlocked: boolean) => void;
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({
  visible,
  onClose,
  targetUserId,
  targetUserName,
  isBlocked,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para realizar esta acción.');
      return;
    }

    setLoading(true);
    try {
      if (isBlocked) {
        await unblockUser(user.uid, targetUserId);
        Alert.alert('Usuario Desbloqueado', `${targetUserName} ha sido desbloqueado.`);
        if (onSuccess) onSuccess(false);
      } else {
        await blockUser(user.uid, targetUserId);
        Alert.alert('Usuario Bloqueado', `${targetUserName} ha sido bloqueado.`);
        if (onSuccess) onSuccess(true);
      }
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>
            {isBlocked ? '¿Desbloquear usuario?' : '¿Bloquear usuario?'}
          </Text>
          <Text style={styles.message}>
            {isBlocked
              ? `¿Estás seguro de que deseas desbloquear a ${targetUserName}? Volverán a ver sus mensajes y salas mutuamente.`
              : `Al bloquear a ${targetUserName}, no verás sus mensajes en el chat, no podrán entrar a tus salas y no podrán contactarte.`}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                isBlocked ? styles.unblockBtn : styles.blockBtn,
              ]}
              onPress={handleAction}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <Text style={styles.confirmText}>
                  {isBlocked ? 'Desbloquear' : 'Bloquear'}
                </Text>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    backgroundColor: '#1E1B30',
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1.5,
    borderColor: '#292440',
    alignItems: 'center',
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#151221',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  confirmBtn: {
    flex: 1.2,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockBtn: {
    backgroundColor: colors.secondary, // red/pink for blocking
  },
  unblockBtn: {
    backgroundColor: colors.primary, // purple for unblocking
  },
  confirmText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 'bold',
  },
});
