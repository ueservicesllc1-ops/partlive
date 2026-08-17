import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';

interface HostGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveGoal: (title: string, targetDiamonds: number) => void;
  currentTitle?: string;
  currentTargetDiamonds?: number;
}

export const HostGoalModal: React.FC<HostGoalModalProps> = ({
  visible,
  onClose,
  onSaveGoal,
  currentTitle = '🎯 Meta del Live',
  currentTargetDiamonds = 5000,
}) => {
  const [title, setTitle] = useState(currentTitle);
  const [targetText, setTargetText] = useState(String(currentTargetDiamonds || 5000));

  const handleSave = () => {
    const num = parseInt(targetText.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Valor inválido', 'Ingresa una cantidad válida de Diamantes.');
      return;
    }
    onSaveGoal(title.trim() || '🎯 Meta del Live', num);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>🎯 Configurar Meta de Regalos</Text>

          <Text style={styles.label}>Título de la Meta:</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: ¡Road to 50K!"
            placeholderTextColor={colors.textMuted}
            maxLength={30}
          />

          <Text style={styles.label}>Meta de Diamantes (💎):</Text>
          <TextInput
            style={styles.input}
            value={targetText}
            onChangeText={setTargetText}
            keyboardType="number-pad"
            placeholder="5000"
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleSave}>
              <Text style={styles.btnSaveText}>Guardar Meta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#1E1B30',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#342D54',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#141124',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#292440',
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: '#2A2542',
  },
  btnCancelText: {
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  btnSave: {
    backgroundColor: colors.accent,
  },
  btnSaveText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
