import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onPostCreated,
}) => {
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'SUBSCRIBER' | 'CLUB'>('PUBLIC');
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!text.trim()) {
      Alert.alert('Atención', 'Escribe algo antes de publicar.');
      return;
    }

    setLoading(true);
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      await apiFetch('/social/posts-api/posts', {
        method: 'POST',
        body: JSON.stringify({
          text,
          visibility,
          contentType: 'TEXT',
        }),
      });

      setText('');
      if (onPostCreated) onPostCreated();
      onClose();
      Alert.alert('¡Publicado!', 'Tu publicación ha sido creada exitosamente.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear la publicación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>✍️ Nueva Publicación</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="¿Qué quieres compartir hoy con tu comunidad?"
            placeholderTextColor={colors.textMuted}
            multiline
            value={text}
            onChangeText={setText}
          />

          <Text style={styles.visLabel}>Visibilidad:</Text>
          <View style={styles.visRow}>
            <TouchableOpacity
              style={[styles.visChip, visibility === 'PUBLIC' && styles.visChipActive]}
              onPress={() => setVisibility('PUBLIC')}
            >
              <Text style={[styles.visText, visibility === 'PUBLIC' && styles.visTextActive]}>Público</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.visChip, visibility === 'SUBSCRIBER' && styles.visChipActive]}
              onPress={() => setVisibility('SUBSCRIBER')}
            >
              <Text style={[styles.visText, visibility === 'SUBSCRIBER' && styles.visTextActive]}>👑 Suscriptores</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.publishBtnText}>Publicar</Text>
            )}
          </TouchableOpacity>
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
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 12,
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
  input: {
    backgroundColor: '#1E1B30',
    color: '#FFF',
    borderRadius: 14,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  visLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  visRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visChip: {
    backgroundColor: '#1E1B30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#342D54',
  },
  visChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  visText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  visTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  publishBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  publishBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
