import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { ReportReason, ReportTargetType } from '../../types';
import { REPORT_TARGET_TYPES } from '../../constants/moderation';
import { colors, spacing, textPresets } from '../../theme';
import { ReportReasonSelector } from './ReportReasonSelector';
import {
  reportUser,
  reportRoom,
  reportLive,
  reportMessage,
} from '../../services/firebase/firestore/reportsService';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerId?: string; // Owner of the room/live/message being reported
  parentId?: string; // roomId/liveId for messages
}

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  targetType,
  targetId,
  targetOwnerId,
  parentId,
}) => {
  const { userProfile } = useAuth();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'Debes iniciar sesión para reportar.');
      return;
    }

    if (!reason) {
      Alert.alert('Motivo requerido', 'Por favor selecciona un motivo para el reporte.');
      return;
    }

    setSubmitting(true);
    try {
      // Map reporter profile format for reportsService (needs uid/displayName/username)
      const reporter = {
        uid: userProfile.uid,
        displayName: userProfile.displayName,
        username: userProfile.username,
      };

      if (targetType === 'user') {
        await reportUser(reporter, targetId, reason, description);
      } else if (targetType === 'room') {
        await reportRoom(reporter, targetId, targetOwnerId || '', reason, description);
      } else if (targetType === 'live') {
        await reportLive(reporter, targetId, targetOwnerId || '', reason, description);
      } else if (targetType === 'message') {
        if (!parentId) {
          throw new Error('parentId (roomId o liveId) es requerido para reportar mensajes.');
        }
        // Messages are usually room messages or live messages.
        // Let's decide if it's 'room' or 'live' parent type.
        // If parentId is provided, let's pass targetType as 'message' but map it in reportsService.
        // In reportsService, reportMessage takes:
        // reporterProfile, targetType (can be 'message'), parentId, messageId, messageOwnerId, reason, description
        await reportMessage(
          reporter,
          'message',
          parentId,
          targetId,
          targetOwnerId || '',
          reason,
          description
        );
      } else {
        Alert.alert('Error', 'Tipo de reporte no soportado.');
        setSubmitting(false);
        return;
      }

      Alert.alert(
        'Reporte Enviado',
        'Gracias. Revisaremos tu reporte lo antes posible y tomaremos medidas si es necesario.'
      );
      setReason(null);
      setDescription('');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Ocurrió un error al enviar el reporte.');
    } finally {
      setSubmitting(false);
    }
  };

  const targetLabel = REPORT_TARGET_TYPES[targetType] || 'Contenido';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <View style={styles.content} onStartShouldSetResponder={() => true}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Reportar {targetLabel}</Text>
                <Text style={styles.headerSubtitle}>
                  Ayúdanos a mantener la comunidad segura y respetuosa.
                </Text>
              </View>

              <ReportReasonSelector selectedReason={reason} onSelectReason={setReason} />

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Detalles adicionales (opcional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe lo sucedido..."
                  placeholderTextColor={colors.textDark}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  value={description}
                  onChangeText={setDescription}
                />
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, !reason && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={!reason || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.text} size="small" />
                  ) : (
                    <Text style={styles.submitText}>Enviar Reporte</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#1E1B30',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderWidth: 1.5,
    borderColor: '#292440',
  },
  scrollContent: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#292440',
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...textPresets.h3,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  inputContainer: {
    marginVertical: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: colors.textDark,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
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
  submitBtn: {
    flex: 1.5,
    backgroundColor: colors.secondary, // Pink/red accent for warning/report actions
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: 'bold',
  },
});
