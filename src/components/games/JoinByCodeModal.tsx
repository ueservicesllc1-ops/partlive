import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { isValidInviteCode, normalizeInviteCode } from '../../utils/inviteCode';

interface JoinByCodeModalProps {
  visible: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}

export const JoinByCodeModal: React.FC<JoinByCodeModalProps> = ({
  visible,
  onClose,
  onJoin,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setError(null);
    const normalized = normalizeInviteCode(code);
    
    if (!isValidInviteCode(normalized)) {
      setError('El código debe tener 6 letras o números válidos.');
      return;
    }

    setLoading(true);
    try {
      await onJoin(normalized);
      setCode('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Código incorrecto o expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Text style={styles.title}>Unirse con Código</Text>
            <Text style={styles.subtitle}>
              Ingresa el código de 6 caracteres proporcionado por tu amigo.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ej: AB23XY"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={val => {
                setCode(val);
                if (error) setError(null);
              }}
              autoCapitalize="characters"
              maxLength={6}
              editable={!loading}
            />

            {error && <Text style={styles.errorText}>⚠️ {error}</Text>}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleJoin}
                disabled={loading || code.trim().length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: '#1E1935',
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#2D274A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: { ...textPresets.h3, color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { ...textPresets.caption, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  input: {
    backgroundColor: '#0B0813',
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    borderRadius: 12,
    paddingVertical: spacing.md,
    letterSpacing: 4,
    borderWidth: 1,
    borderColor: '#2D274A',
    marginBottom: spacing.md,
  },
  errorText: { ...textPresets.caption, color: colors.error, textAlign: 'center', marginBottom: spacing.md },
  buttonContainer: { flexDirection: 'row', gap: spacing.md },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: { backgroundColor: '#2D274A' },
  cancelButtonText: { ...textPresets.bodyMedium, color: colors.textMuted, fontWeight: '700' },
  submitButton: { backgroundColor: colors.primary },
  submitButtonText: { ...textPresets.bodyMedium, color: '#FFF', fontWeight: '700' },
});
