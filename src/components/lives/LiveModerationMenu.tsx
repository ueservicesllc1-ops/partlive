import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';

interface LiveModerationMenuProps {
  visible: boolean;
  onClose: () => void;
  targetUser: { userId: string; displayName: string; role: 'host' | 'moderator' | 'viewer' } | null;
  actorRole: 'host' | 'moderator' | 'viewer';
  onMuteToggle: (userId: string, isMuted: boolean) => void;
  onKick: (userId: string) => void;
  onAddModerator?: (userId: string) => void;
  onRemoveModerator?: (userId: string) => void;
  isTargetMuted?: boolean;
}

export const LiveModerationMenu: React.FC<LiveModerationMenuProps> = ({
  visible,
  onClose,
  targetUser,
  actorRole,
  onMuteToggle,
  onKick,
  onAddModerator,
  onRemoveModerator,
  isTargetMuted = false,
}) => {
  if (!targetUser) return null;

  const isHost = actorRole === 'host';
  const isTargetViewer = targetUser.role === 'viewer';
  const isTargetMod = targetUser.role === 'moderator';

  // Determine permissions
  const canMute = isHost || (actorRole === 'moderator' && isTargetViewer);
  const canKick = isHost || (actorRole === 'moderator' && isTargetViewer);
  const canManageMod = isHost && (isTargetViewer || isTargetMod);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Moderación de Usuario</Text>
          <Text style={styles.userName}>{targetUser.displayName}</Text>
          <Text style={styles.userRole}>Rol: {targetUser.role.toUpperCase()}</Text>

          <ScrollView style={styles.optionsList}>
            {canMute && (
              <TouchableOpacity
                style={styles.optionBtn}
                onPress={() => {
                  onMuteToggle(targetUser.userId, !isTargetMuted);
                  onClose();
                }}
              >
                <Text style={styles.optionText}>
                  {isTargetMuted ? '🔊 Despejar Silencio' : '🔇 Silenciar Chat'}
                </Text>
              </TouchableOpacity>
            )}

            {canKick && (
              <TouchableOpacity
                style={[styles.optionBtn, styles.dangerBtn]}
                onPress={() => {
                  onKick(targetUser.userId);
                  onClose();
                }}
              >
                <Text style={[styles.optionText, styles.dangerText]}>🚪 Expulsar del Live</Text>
              </TouchableOpacity>
            )}

            {canManageMod && onAddModerator && onRemoveModerator && (
              <TouchableOpacity
                style={styles.optionBtn}
                onPress={() => {
                  if (isTargetMod) {
                    onRemoveModerator(targetUser.userId);
                  } else {
                    onAddModerator(targetUser.userId);
                  }
                  onClose();
                }}
              >
                <Text style={styles.optionText}>
                  {isTargetMod ? '🛡️ Quitar Moderador' : '🛡️ Hacer Moderador'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1E1B30',
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#292440',
    alignItems: 'center',
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  optionsList: {
    width: '100%',
  },
  optionBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#292440',
  },
  optionText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  dangerBtn: {
    borderBottomColor: '#292440',
  },
  dangerText: {
    color: colors.error,
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
});
