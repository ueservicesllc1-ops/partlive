import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { Button } from '../Button';

interface EnterRoomPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  loading?: boolean;
  errorMessage?: string;
}

export const EnterRoomPasswordModal: React.FC<EnterRoomPasswordModalProps> = ({
  visible,
  onClose,
  onSubmit,
  loading = false,
  errorMessage,
}) => {
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (password.length >= 4) {
      onSubmit(password);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Sala Privada</Text>
          <Text style={styles.subtitle}>Esta sala requiere una contraseña para ingresar.</Text>

          <TextInput
            style={styles.input}
            placeholder="Introduce la contraseña"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            keyboardType="numeric"
            value={password}
            onChangeText={setPassword}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Button
              title={loading ? 'Validando...' : 'Entrar'}
              onPress={handleSubmit}
              disabled={password.length < 4 || loading}
              style={styles.submitBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    backgroundColor: colors.background,
    borderColor: '#292440',
    borderWidth: 1,
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E1B30',
    color: colors.text,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#292440',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#FF4A4A',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1.5,
  },
});
