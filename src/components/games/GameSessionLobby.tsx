import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { GamePlayer, GameSession } from '../../types/game';
import { InvitePlayersModal } from './InvitePlayersModal';

interface GameSessionLobbyProps {
  session: GameSession;
  players: GamePlayer[];
  myUserId: string;
  minPlayers: number;
  maxPlayers: number;
  isHost: boolean;
  onReady: () => void;
  onLeave: () => void;
  myPlayer: GamePlayer | null;
}

export const GameSessionLobby: React.FC<GameSessionLobbyProps> = ({
  session,
  players,
  myUserId,
  minPlayers,
  maxPlayers,
  isHost,
  onReady,
  onLeave,
  myPlayer,
}) => {
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const readyCount = players.filter(p => p.isReady).length;
  const canStart = players.length >= minPlayers;
  const isPrivate = session.visibility === 'private';

  const handleShareCode = async () => {
    if (!session.inviteCode) return;
    try {
      await Share.share({
        message: `¡Únete a mi partida de ${session.gameSlug.toUpperCase()} en PartyLiveApp! Código de invitación: ${session.inviteCode}`,
      });
    } catch (error) {
      console.error('Error sharing game session code:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Visibility Badge */}
      <View style={styles.badgeRow}>
        <View style={[styles.visBadge, isPrivate ? styles.visPrivate : styles.visPublic]}>
          <Text style={styles.visText}>
            {isPrivate ? '🔒 Solo con invitación/código' : '🌐 Partida pública'}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>Sala de Espera</Text>
      <Text style={styles.subtitle}>
        {players.length}/{maxPlayers} jugadores · {readyCount} listos
      </Text>

      {/* Private session panel */}
      {isPrivate && session.inviteCode && (
        <View style={styles.invitePanel}>
          <View>
            <Text style={styles.inviteLabel}>CÓDIGO DE PARTIDA</Text>
            <Text style={styles.inviteCode}>{session.inviteCode}</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShareCode}>
            <Text style={styles.shareBtnText}>Compartir</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Invite Friends Button */}
      <TouchableOpacity
        style={styles.inviteFriendsBtn}
        onPress={() => setInviteModalVisible(true)}
      >
        <Text style={styles.inviteFriendsBtnText}>➕ Invitar Jugadores</Text>
      </TouchableOpacity>

      {/* Player slots */}
      <ScrollView style={styles.playerList} contentContainerStyle={styles.playerListContent}>
        {Array.from({ length: maxPlayers }).map((_, i) => {
          const player = players[i];
          if (!player) {
            return (
              <View key={`slot-${i}`} style={styles.slotEmpty}>
                <Text style={styles.slotEmptyIcon}>👤</Text>
                <Text style={styles.slotEmptyText}>Esperando...</Text>
              </View>
            );
          }
          const isMe = player.userId === myUserId;
          return (
            <View key={player.userId} style={[styles.playerRow, isMe && styles.playerRowMe]}>
              <Text style={styles.playerAvatar}>{player.avatarEmoji ?? '🎮'}</Text>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {player.username}
                  {isMe ? ' (Tú)' : ''}
                  {player.isHost ? ' 👑' : ''}
                </Text>
              </View>
              <View style={[styles.readyBadge, player.isReady && styles.readyBadgeOn]}>
                <Text style={[styles.readyText, player.isReady && styles.readyTextOn]}>
                  {player.isReady ? '✓ Listo' : 'Esperando'}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {!canStart && (
        <Text style={styles.waitText}>
          Esperando al menos {minPlayers} jugadores para comenzar
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.leaveBtn} onPress={onLeave}>
          <Text style={styles.leaveBtnText}>Salir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.readyBtn,
            myPlayer?.isReady && styles.readyBtnActive,
          ]}
          onPress={onReady}
          disabled={myPlayer?.isReady}
        >
          <Text style={styles.readyBtnText}>
            {myPlayer?.isReady ? '✓ Listo' : '¡Listo!'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Player Invite Modal */}
      <InvitePlayersModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        session={session}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl },
  badgeRow: { alignItems: 'center', marginBottom: spacing.xs },
  visBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  visPublic: {
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
  },
  visPrivate: {
    backgroundColor: colors.warning + '22',
    borderColor: colors.warning,
  },
  visText: { ...textPresets.caption, color: colors.text, fontWeight: '700' },
  title: { ...textPresets.h2, color: colors.text, textAlign: 'center', marginBottom: 4 },
  subtitle: { ...textPresets.caption, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  
  invitePanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1935',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#2D274A',
    marginBottom: spacing.md,
  },
  inviteLabel: { fontSize: 9, color: colors.textMuted, fontWeight: '700', letterSpacing: 1 },
  inviteCode: { fontSize: 22, fontWeight: '900', color: colors.accent, letterSpacing: 2 },
  shareBtn: {
    backgroundColor: colors.accent + '22',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  shareBtnText: { ...textPresets.caption, color: colors.accent, fontWeight: '700' },
  
  inviteFriendsBtn: {
    backgroundColor: '#2D274A',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#3D375E',
  },
  inviteFriendsBtnText: { ...textPresets.caption, color: colors.text, fontWeight: '700' },

  playerList: { flex: 1, marginBottom: spacing.lg },
  playerListContent: { gap: spacing.sm },
  slotEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
    opacity: 0.5,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  slotEmptyIcon: { fontSize: 24 },
  slotEmptyText: { ...textPresets.bodyMedium, color: colors.textDark },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  playerRowMe: { borderColor: colors.primary + '88', backgroundColor: colors.surfaceLight },
  playerAvatar: { fontSize: 28 },
  playerInfo: { flex: 1 },
  playerName: { ...textPresets.bodyMedium, color: colors.text, fontWeight: '600' },
  readyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readyBadgeOn: { backgroundColor: colors.success + '22', borderColor: colors.success },
  readyText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  readyTextOn: { color: colors.success },
  waitText: {
    ...textPresets.caption,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  leaveBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leaveBtnText: { ...textPresets.bodyMedium, color: colors.textMuted, fontWeight: '700' },
  readyBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  readyBtnActive: { backgroundColor: colors.success },
  readyBtnText: { ...textPresets.bodyMedium, color: '#fff', fontWeight: '700' },
});
