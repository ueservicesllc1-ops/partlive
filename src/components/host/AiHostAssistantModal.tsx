import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';

interface AiHostAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTitle?: (title: string) => void;
}

export const AiHostAssistantModal: React.FC<AiHostAssistantModalProps> = ({
  visible,
  onClose,
  onSelectTitle,
}) => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/ai/pre-live-plan', {
        method: 'POST',
        body: JSON.stringify({ category: 'PARTY' }),
      });
      setPlan(res.plan);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo conectar con el Asistente IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>🤖 Asistente IA para Hosts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {!plan ? (
              <View style={styles.introBox}>
                <Text style={styles.introEmoji}>💡</Text>
                <Text style={styles.introTitle}>Planifica y optimiza tu Live con IA</Text>
                <Text style={styles.introSub}>
                  Obtén sugerencias de títulos llamativos, temas de conversación, preguntas para la audiencia y metas recomendadas.
                </Text>
                <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.generateBtnText}>Generar Plan de Live</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.planResults}>
                <Text style={styles.sectionLabel}>📌 Sugerencias de Títulos:</Text>
                {plan.suggestedTitles?.map((t: string, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.titleCard}
                    onPress={() => {
                      if (onSelectTitle) onSelectTitle(t);
                      onClose();
                    }}
                  >
                    <Text style={styles.titleText}>{t}</Text>
                    <Text style={styles.useText}>Usar este →</Text>
                  </TouchableOpacity>
                ))}

                <Text style={styles.sectionLabel}>❓ Preguntas para la Audiencia:</Text>
                {plan.suggestedQuestions?.map((q: string, idx: number) => (
                  <View key={idx} style={styles.questionCard}>
                    <Text style={styles.questionText}>• {q}</Text>
                  </View>
                ))}
              </View>
            )}
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
  },
  introBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  introEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  introSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  generateBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
  },
  generateBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  planResults: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 8,
  },
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1B30',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#342D54',
  },
  titleText: {
    fontSize: 13,
    color: '#FFF',
    flex: 1,
    marginRight: 8,
  },
  useText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.accent,
  },
  questionCard: {
    backgroundColor: '#1E1B30',
    padding: 10,
    borderRadius: 10,
  },
  questionText: {
    fontSize: 12,
    color: '#FFF',
  },
});
