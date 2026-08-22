import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { colors, spacing } from '../../theme';
import { Room } from '../../types';
import { updateRoom } from '../../services/firebase/firestore/roomsService';
import { useAuth } from '../../store/AuthContext';

interface KaraokePlayerProps {
  room: Room;
  isPrivileged: boolean; // Owner, host or mod
}

export const KaraokePlayer: React.FC<KaraokePlayerProps> = ({ room, isPrivileged }) => {
  const { userProfile } = useAuth();
  const [showInput, setShowInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const activeSong = room.activeSong;

  // Extract Youtube ID from standard URL formats
  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSetSong = async () => {
    if (!youtubeUrl.trim() || !userProfile) return;
    
    const videoId = extractYoutubeId(youtubeUrl.trim());
    if (!videoId) {
      Alert.alert('Error', 'Ingresa una URL válida de YouTube (ej. https://youtu.be/...)');
      return;
    }

    setLoading(true);
    try {
      await updateRoom(room.id, {
        activeSong: {
          videoId,
          title: 'Pista de YouTube',
          addedBy: userProfile.uid,
          addedAt: new Date(),
          isPlaying: true,
        }
      });
      setShowInput(false);
      setYoutubeUrl('');
    } catch (e) {
      console.error('Error setting song:', e);
      Alert.alert('Error', 'No se pudo actualizar la pista.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSong = async () => {
    try {
      await updateRoom(room.id, {
        activeSong: null as any // Firestore field deletion can be handled by passing null if supported, or field deletion token. Using null for now.
      });
    } catch (e) {
      console.error('Error stopping song:', e);
    }
  };

  return (
    <View style={styles.container}>
      {activeSong ? (
        <View style={styles.playerActive}>
          <View style={styles.iframeWrapper}>
            <YoutubeIframe
              height={220}
              play={activeSong.isPlaying}
              videoId={activeSong.videoId}
              initialPlayerParams={{
                controls: isPrivileged ? 1 : 0, // Only host can scrub
                preventFullScreen: true,
                modestbranding: 1,
              }}
            />
          </View>
          {isPrivileged && (
            <TouchableOpacity style={styles.stopBtn} onPress={handleStopSong}>
              <Text style={styles.stopBtnText}>✕ Quitar Pista</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : showInput ? (
        <View style={styles.inputState}>
          <Text style={styles.inputLabel}>Pega el link de YouTube:</Text>
          <TextInput
            style={styles.input}
            placeholder="https://youtu.be/..."
            placeholderTextColor={colors.textMuted}
            value={youtubeUrl}
            onChangeText={setYoutubeUrl}
            autoCapitalize="none"
          />
          <View style={styles.inputActions}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => { setShowInput(false); setYoutubeUrl(''); }}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addBtn, (!youtubeUrl || loading) && { opacity: 0.5 }]} 
              onPress={handleSetSong}
              disabled={!youtubeUrl || loading}
            >
              <Text style={styles.addBtnText}>{loading ? 'Cargando...' : 'Reproducir'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎶</Text>
          <Text style={styles.emptyTitle}>Escenario de Karaoke</Text>
          <Text style={styles.emptySub}>Nadie está cantando en este momento</Text>
          
          {isPrivileged && (
            <TouchableOpacity style={styles.addSongBtn} onPress={() => setShowInput(true)} activeOpacity={0.8}>
              <Text style={styles.addSongBtnText}>+ Elegir Pista de YouTube</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    backgroundColor: '#1E1B30',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#292440',
    marginVertical: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
    opacity: 0.8,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.lg,
  },
  addSongBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addSongBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputState: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  inputLabel: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#393450',
    marginBottom: spacing.lg,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  playerActive: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  iframeWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  stopBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  stopBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
