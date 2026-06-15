import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing } from '../../theme';
import { useVerification } from '../../hooks/useVerification';
import { Button } from '../../components/Button';

export const VerificationFormScreen = ({ navigation }: any) => {
  const { idDoc, selfie, pickIdDoc, pickSelfie, submit, loading, error, success } = useVerification();

  const [realName, setRealName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [docType, setDocType] = useState('DNI / RUT');
  const [role, setRole] = useState<'host' | 'agency'>('host');

  const handleSubmit = async () => {
    if (!realName || !docNumber) {
      Alert.alert('Error', 'Por favor, ingresa tu nombre y número de documento.');
      return;
    }
    await submit(realName, docNumber, docType, role);
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successWrapper}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Solicitud de KYC Enviada</Text>
          <Text style={styles.successText}>
            Tu información y documentos se cargaron correctamente y están en revisión.
          </Text>
          <Button
            title="Aceptar"
            variant="primary"
            onPress={() => navigation.popToTop()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Formulario KYC</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.form}>
          <Text style={styles.label}>Rol de Monetización</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleOption, role === 'host' && styles.roleActive]}
              onPress={() => setRole('host')}
            >
              <Text style={[styles.roleText, role === 'host' && styles.roleTextActive]}>Host / Streamer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleOption, role === 'agency' && styles.roleActive]}
              onPress={() => setRole('agency')}
            >
              <Text style={[styles.roleText, role === 'agency' && styles.roleTextActive]}>Agencia Owner</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nombre Completo (Como figura en tu ID)</Text>
          <TextInput
            style={styles.input}
            value={realName}
            onChangeText={setRealName}
            placeholder="Ej. Juan Pérez"
            placeholderTextColor={colors.textDark}
          />

          <Text style={styles.label}>Tipo de Documento</Text>
          <TextInput
            style={styles.input}
            value={docType}
            onChangeText={setDocType}
            placeholder="Ej. Cédula de Identidad, Pasaporte"
            placeholderTextColor={colors.textDark}
          />

          <Text style={styles.label}>Número de Documento</Text>
          <TextInput
            style={styles.input}
            value={docNumber}
            onChangeText={setDocNumber}
            placeholder="Ej. 12.345.678-9"
            placeholderTextColor={colors.textDark}
          />

          <Text style={styles.label}>Documento de Identidad (Foto Frontal)</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickIdDoc}>
            <Text style={styles.uploadBtnText}>
              {idDoc ? `✓ Seleccionado: ${idDoc.name.substring(0, 15)}...` : '📸 Seleccionar Documento'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Selfie de Verificación (Con tu documento en mano)</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickSelfie}>
            <Text style={styles.uploadBtnText}>
              {selfie ? `✓ Seleccionado: ${selfie.name.substring(0, 15)}...` : '📸 Seleccionar Selfie'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.submitBtnText}>Subir y Verificar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  roleActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(138, 79, 255, 0.15)',
  },
  roleText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleTextActive: {
    color: colors.primary,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 13,
  },
  uploadBtn: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  uploadBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  successWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    color: colors.success,
    fontSize: 20,
    fontWeight: 'bold',
  },
  successText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
});
export default VerificationFormScreen;
