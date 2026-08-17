import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';

interface AiLiveSummaryModalProps {
  visible: boolean;
  liveId: string;
  peakViewers: number;
  totalDiamonds: number;
  onClose: () => void;
}

export const AiLiveSummaryModal: React.FC<AiLiveSummaryModalProps> = ({
  visible,
  liveId,
  peakViewers,
  totalDiamonds,
  onClose,
}) => {
  const [creatingClip, setCreatingClip] = useState(false);

  const handleCreateClipFromMoment = async (reason: string) => {
    setCreatingClip(true);
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      await apiFetch('/clips/create', {
        method: 'POST',
        body: JSON.stringify({
          liveId,
          title: `Momento Destacado: ${reason}`,
          description: 'Clip generado automáticamente por la IA de PartyLive',
          videoUrl: 'https://cdn.partylive.app/clips/highlight_sample.mp4',
          durationSeconds: 30,
        }),
      });
      Alert.alert('¡Clip Publicado!', 'El momento destacado fue publicado exitosamente en el Feed de Clips.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear el clip.');
    } finally {
      setCreatingClip(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>📊 Resumen de Live por IA</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Stats Row */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{peakViewers}</Text>
                <Text style={styles.statLabel}>Pico Espectadores</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#FFD700' }]}>💎 {totalDiamonds}</Text>
                <Text style={styles.statLabel}>Diamantes</Text>
              </View>
            </View>

            {/* AI Insights */}
            <Text style={styles.sectionLabel}>💡 Insights de la IA:</Text>
            <View style={styles.insightCard}>
              <Text style={styles.insightText}>
                • La retención de tu audiencia fue máxima durante las Batallas PK.
              </Text>
              <Text style={styles.insightText}>
                • Establecer la Meta de Diamantes aumentó los regalos recibidos en un 40%.
              </Text>
            </View>

            {/* Auto-detected Clips */}
            <Text style={styles.sectionLabel}>🎬 Clips Sugeridos (1-Tap):</Text>
            <TouchableOpacity
              style={styles.clipBtn}
              disabled={creatingClip}
              onPress={() => handleCreateClipFromMoment('Regalo Galaxy Enviado')}
            >
              <Text style={styles.clipBtnText}>👑 Crear Clip: Regalo Galaxy Enviado</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clipBtn}
              disabled={creatingClip}
              onPress={() => handleCreateClipFromMoment('Remontada Épica PK')}
            >
              <Text style={styles.clipBtnText}>⚔️ Crear Clip: Remontada Épica PK</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#141124',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: '#26203D',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  body: {
    paddingVertical: spacing.md,
    gap: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1E1B30',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#342D54',
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 6,
  },
  insightCard: {
    backgroundColor: '#1E1B30',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  insightText: {
    fontSize: 12,
    color: '#FFF',
    lineHeight: 16,
  },
  clipBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  clipBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
