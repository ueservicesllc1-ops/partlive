import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { RoomMember } from '../../types';
import { RoomRole } from '../../constants/roomPermissions';
import { getAvailableRoomActions } from '../../utils/roomPermissions';
import { colors, spacing, textPresets } from '../../theme';
import { Avatar } from '../Avatar';
import { RoomRoleBadge } from './RoomRoleBadge';

interface RoomMemberActionsModalProps {
  visible: boolean;
  actorRole: RoomRole | null;
  targetMember: RoomMember | null;
  currentUserId: string;
  onClose: () => void;
  onMute: (targetId: string, mute: boolean) => void;
  onKick: (targetId: string) => void;
  onPromoteToHost: (targetId: string) => void;
  onRemoveHost: (targetId: string) => void;
  onPromoteToModerator: (targetId: string) => void;
  onRemoveModerator: (targetId: string) => void;
  onMoveToSpeaker: (targetId: string) => void;
  onRemoveFromSpeaker: (targetId: string) => void;
  onViewProfile?: (targetId: string) => void;
}

export const RoomMemberActionsModal: React.FC<RoomMemberActionsModalProps> = ({
  visible,
  actorRole,
  targetMember,
  currentUserId,
  onClose,
  onMute,
  onKick,
  onPromoteToHost,
  onRemoveHost,
  onPromoteToModerator,
  onRemoveModerator,
  onMoveToSpeaker,
  onRemoveFromSpeaker,
  onViewProfile,
}) => {
  if (!targetMember) return null;

  const isOwnUser = targetMember.userId === currentUserId;
  const actions = getAvailableRoomActions(actorRole, targetMember.role, isOwnUser);

  const handleAction = (callback: () => void) => {
    callback();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header info */}
            <View style={styles.header}>
              <Avatar source={targetMember.photoURL} emoji="👤" size={64} />
              <View style={styles.memberInfo}>
                <Text style={styles.name}>{targetMember.displayName}</Text>
                {targetMember.username && <Text style={styles.username}>@{targetMember.username}</Text>}
                <View style={styles.badgeRow}>
                  <RoomRoleBadge role={targetMember.role} />
                  {targetMember.seatIndex !== undefined && (
                    <View style={styles.seatBadge}>
                      <Text style={styles.seatText}>Asiento {targetMember.seatIndex + 1}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Actions list */}
            <View style={styles.actionsContainer}>
              {onViewProfile && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleAction(() => onViewProfile(targetMember.userId))}
                >
                  <Text style={styles.actionText}>👤 Ver Perfil Público</Text>
                </TouchableOpacity>
              )}

              {/* Mute / Unmute */}
              {actions.canMute && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    handleAction(() => onMute(targetMember.userId, !targetMember.isMuted))
                  }
                >
                  <Text style={styles.actionText}>
                    {targetMember.isMuted ? '🔊 Desactivar Silencio' : '🔇 Silenciar Usuario'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Speaker controls */}
              {targetMember.seatIndex !== undefined ? (
                // Already speaker, allow removing
                (actorRole === 'owner' || actorRole === 'host' || isOwnUser) && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleAction(() => onRemoveFromSpeaker(targetMember.userId))}
                  >
                    <Text style={styles.actionText}>🎙️ Bajar del Escenario</Text>
                  </TouchableOpacity>
                )
              ) : (
                // Listener, allow promoting to Speaker directly if slots available
                actions.canAssignSpeaker && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleAction(() => onMoveToSpeaker(targetMember.userId))}
                  >
                    <Text style={styles.actionText}>🎙️ Invitar al Escenario</Text>
                  </TouchableOpacity>
                )
              )}

              {/* Host Promotions (Owner only) */}
              {actions.canAssignHost && (
                targetMember.role === 'host' ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleAction(() => onRemoveHost(targetMember.userId))}
                  >
                    <Text style={styles.actionText}>❌ Quitar cargo de Host</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleAction(() => onPromoteToHost(targetMember.userId))}
                  >
                    <Text style={styles.actionText}>⭐ Nombrar como Host</Text>
                  </TouchableOpacity>
                )
              )}

              {/* Moderator Promotions (Owner only) */}
              {actions.canAssignMod && (
                targetMember.role === 'moderator' ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleAction(() => onRemoveModerator(targetMember.userId))}
                  >
                    <Text style={styles.actionText}>❌ Quitar cargo de Moderador</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleAction(() => onPromoteToModerator(targetMember.userId))}
                  >
                    <Text style={styles.actionText}>🛡️ Nombrar como Moderador</Text>
                  </TouchableOpacity>
                )
              )}

              {/* Kick (Expulsar de la sala) */}
              {actions.canKick && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.dangerBtn]}
                  onPress={() => handleAction(() => onKick(targetMember.userId))}
                >
                  <Text style={styles.dangerText}>🥾 Expulsar de la Sala</Text>
                </TouchableOpacity>
              )}
            </View>

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
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#1E1B30',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    borderWidth: 1.5,
    borderColor: '#292440',
  },
  scrollContent: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#292440',
    paddingBottom: spacing.md,
  },
  memberInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  name: {
    ...textPresets.h3,
    color: colors.text,
  },
  username: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  seatBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  seatText: {
    fontSize: 8,
    color: '#00E5FF',
    fontWeight: 'bold',
  },
  actionsContainer: {
    gap: spacing.xs,
  },
  actionBtn: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#292440',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    color: colors.text,
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
    marginTop: spacing.lg,
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
