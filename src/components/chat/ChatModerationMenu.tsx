import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { ChatMessage } from '../../types';
import { colors, spacing, textPresets } from '../../theme';
import { RoomRole } from '../../constants/roomPermissions';
import { canHideMessage, canManageRole } from '../../utils/roomPermissions';

interface ChatModerationMenuProps {
  isVisible: boolean;
  message?: ChatMessage;
  currentUserId: string;
  canModerate: boolean;
  onClose: () => void;
  onDeleteMessage: () => void;
  onHideMessage: (reason: string) => void;
  onReportMessage: (reason: string) => void;
  onBlockUser: () => void;
  onKickMember?: () => void;
  actorRole: RoomRole | null;
}

export const ChatModerationMenu: React.FC<ChatModerationMenuProps> = ({
  isVisible,
  message,
  currentUserId,
  canModerate,
  onClose,
  onDeleteMessage,
  onHideMessage,
  onReportMessage,
  onBlockUser,
  onKickMember,
  actorRole,
}) => {
  if (!message) return null;

  const isOwnMessage = message.senderId === currentUserId;

  const handleReport = (reason: string) => {
    onReportMessage(reason);
    onClose();
  };

  const handleHide = (reason: string) => {
    onHideMessage(reason);
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.menuBox} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Opciones de Mensaje</Text>
          <Text style={styles.subText} numberOfLines={2}>
            "{message.text}"
          </Text>

          {isOwnMessage ? (
            <TouchableOpacity style={styles.optionBtn} onPress={() => { onDeleteMessage(); onClose(); }}>
              <Text style={styles.deleteText}>🗑️ Eliminar mi mensaje</Text>
            </TouchableOpacity>
          ) : (
            <>
              {/* Common User actions */}
              <TouchableOpacity style={styles.optionBtn} onPress={() => handleReport('Spam')}>
                <Text style={styles.optionText}>🚩 Reportar como Spam</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionBtn} onPress={() => handleReport('Lenguaje Inapropiado')}>
                <Text style={styles.optionText}>🚩 Reportar Lenguaje Inapropiado</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionBtn} onPress={() => { onBlockUser(); onClose(); }}>
                <Text style={[styles.optionText, { color: colors.secondary }]}>🚫 Bloquear Usuario</Text>
              </TouchableOpacity>

              {/* Moderator/Admin actions */}
              {canModerate && canHideMessage(actorRole, message.senderRole || 'listener') && (
                <View style={styles.adminSection}>
                  <Text style={styles.adminTitle}>Herramientas de Moderación</Text>
                  
                  <TouchableOpacity style={styles.optionBtn} onPress={() => handleHide('Spam')}>
                    <Text style={styles.adminText}>🔇 Ocultar Mensaje (Spam)</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.optionBtn} onPress={() => handleHide('Inapropiado')}>
                    <Text style={styles.adminText}>🔇 Ocultar Mensaje (Inapropiado)</Text>
                  </TouchableOpacity>

                  {onKickMember && canManageRole(actorRole, message.senderRole || 'listener') && (
                    <TouchableOpacity
                      style={[styles.optionBtn, styles.dangerBtn]}
                      onPress={() => {
                        onKickMember();
                        onClose();
                      }}
                    >
                      <Text style={styles.dangerText}>🥾 Expulsar usuario de la sala</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  menuBox: {
    backgroundColor: '#1E1B30',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: '#292440',
  },
  title: {
    ...textPresets.bodyMedium,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  optionBtn: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#292440',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  deleteText: {
    fontSize: 14,
    color: '#FF1744',
    fontWeight: 'bold',
  },
  adminSection: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255, 64, 129, 0.05)',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 64, 129, 0.15)',
  },
  adminTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  adminText: {
    fontSize: 14,
    color: '#00E5FF',
  },
  dangerBtn: {
    borderBottomWidth: 0,
  },
  dangerText: {
    fontSize: 14,
    color: '#FF1744',
    fontWeight: 'bold',
  },
  cancelBtn: {
    marginTop: spacing.md,
    backgroundColor: '#151221',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
});
