import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { KaraokeQueueItem as QueueItemType } from '../../types/karaoke';

interface KaraokeQueueItemProps {
  item: QueueItemType;
  isHost: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
}

export const KaraokeQueueItem: React.FC<KaraokeQueueItemProps> = ({
  item,
  isHost,
  onApprove,
  onReject,
  onStart,
  onComplete,
  onSkip,
}) => {
  const isSinging = item.status === 'singing';
  const isPending = item.status === 'pending';
  const isApproved = item.status === 'approved';

  return (
    <View style={[styles.card, isSinging && styles.singingCard]}>
      {/* Position indicator */}
      <View style={styles.positionContainer}>
        {isSinging ? (
          <Text style={{ fontSize: 18 }}>🎙️</Text>
        ) : (
          <Text style={styles.positionText}>#{item.position}</Text>
        )}
      </View>

      {/* Avatar */}
      <Image
        source={{ uri: item.singerPhotoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }}
        style={styles.avatar}
      />

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.singerName} numberOfLines={1}>
          {item.singerName}
        </Text>
        <Text style={styles.songTitle} numberOfLines={1}>
          canta: <Text style={{ color: colors.text }}>{item.songTitle}</Text>
        </Text>
      </View>

      {/* Host Controls / Status Badge */}
      <View style={styles.actions}>
        {isHost ? (
          <View style={styles.hostButtons}>
            {isPending && (
              <>
                <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={onReject}>
                  <Text style={{ fontSize: 16 }}>❌</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={onApprove}>
                  <Text style={{ fontSize: 16 }}>✅</Text>
                </TouchableOpacity>
              </>
            )}
            {isApproved && (
              <TouchableOpacity style={[styles.btn, styles.btnStart]} onPress={onStart}>
                <Text style={{ fontSize: 12 }}>▶️</Text>
                <Text style={styles.btnText}>Iniciar</Text>
              </TouchableOpacity>
            )}
            {isSinging && (
              <>
                <TouchableOpacity style={[styles.btn, styles.btnSkip]} onPress={onSkip}>
                  <Text style={{ fontSize: 12 }}>⏭️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.btnComplete]} onPress={onComplete}>
                  <Text style={{ fontSize: 12 }}>✔️</Text>
                  <Text style={styles.btnText}>Fin</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={[styles.statusBadge, isSinging && styles.singingBadge]}>
            <Text style={[styles.statusText, isSinging && styles.singingText]}>
              {isSinging ? 'Cantando' : isApproved ? 'Listo' : 'Pendiente'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  singingCard: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  positionContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLight,
    marginLeft: 4,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  singerName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  songTitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    justifyContent: 'center',
  },
  hostButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  btnApprove: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
  },
  btnReject: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
  },
  btnStart: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
  },
  btnSkip: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnComplete: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
  },
  btnText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  singingBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  singingText: {
    color: colors.accent,
  },
});
