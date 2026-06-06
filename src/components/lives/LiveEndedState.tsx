import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LiveStream } from '../../types/live';
import { colors, spacing, textPresets } from '../../theme';
import { Avatar } from '../Avatar';

interface LiveEndedStateProps {
  live: LiveStream | null;
  onClose: () => void;
}

export const LiveEndedState: React.FC<LiveEndedStateProps> = ({ live, onClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.badge}>TRANSMISIÓN FINALIZADA</Text>

        {live && (
          <>
            <Avatar source={live.hostPhotoURL} emoji="👤" size={72} />
            <Text style={styles.hostName}>{live.hostName}</Text>
            <Text style={styles.title} numberOfLines={2}>
              "{live.title}"
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{live.viewersCount || 0}</Text>
                <Text style={styles.statLabel}>Espectadores</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{live.likesCount || 0}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{live.giftsCount || 0}</Text>
                <Text style={styles.statLabel}>Regalos</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>💎 {live.diamondsEarned || 0}</Text>
                <Text style={styles.statLabel}>Diamantes</Text>
              </View>
            </View>
          </>
        )}

        {!live && <Text style={styles.loadingText}>Cargando resumen del live...</Text>}

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.closeText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F0C1B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 100,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E1B30',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#292440',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  badge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.error,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  hostName: {
    ...textPresets.h3,
    color: '#FFF',
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: spacing.xl,
    justifyContent: 'center',
  },
  statBox: {
    width: '44%',
    backgroundColor: '#151221',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  loadingText: {
    color: colors.textMuted,
    marginVertical: 40,
  },
  closeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
    marginTop: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
