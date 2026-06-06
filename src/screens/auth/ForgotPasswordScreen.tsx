import React, { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, SafeAreaView, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { Button } from '../../components/Button';
import { useAuth } from '../../store/AuthContext';
import { getFriendlyAuthError } from '../../utils/firebaseAuthErrors';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const { sendPasswordReset } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      await sendPasswordReset(email.trim());
      setSuccess(true);
    } catch (err: any) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
            </Text>
          </View>

          <View style={styles.formContainer}>
            {success ? (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✉️</Text>
                <Text style={styles.successTitle}>¡Enlace Enviado!</Text>
                <Text style={styles.successText}>
                  Revisa tu bandeja de entrada o carpeta de spam. Si el correo existe en nuestro sistema, recibirás las instrucciones.
                </Text>
                <Button 
                  title="Volver al inicio" 
                  variant="primary" 
                  size="large" 
                  onPress={() => navigation.navigate('Login')} 
                  style={{ marginTop: spacing.xl, width: '100%' }} 
                />
              </View>
            ) : (
              <>
                <Text style={styles.label}>Correo Electrónico</Text>
                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={colors.textDark}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(null); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {loading ? (
                  <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
                ) : (
                  <Button 
                    title="Enviar enlace" 
                    variant="primary" 
                    size="large" 
                    onPress={handleReset} 
                    style={styles.button} 
                  />
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  header: { marginTop: spacing.xl, marginBottom: spacing.lg },
  backButton: { paddingVertical: spacing.sm, marginBottom: spacing.md, alignSelf: 'flex-start' },
  backButtonText: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
  title: { ...textPresets.h1, color: colors.text },
  subtitle: { ...textPresets.bodyMedium, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 22 },
  formContainer: { width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, borderWidth: 1.5, borderColor: colors.border, marginTop: spacing.md },
  label: { ...textPresets.bodySmall, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: '600' },
  input: { backgroundColor: '#0F0C1B', color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, fontSize: 15 },
  errorContainer: { backgroundColor: 'rgba(255, 23, 68, 0.1)', borderRadius: 8, padding: spacing.md, borderWidth: 1, borderColor: colors.error, marginBottom: spacing.lg },
  errorText: { ...textPresets.bodySmall, color: colors.error, fontWeight: '600', textAlign: 'center' },
  button: { width: '100%', marginTop: spacing.sm },
  loader: { marginVertical: spacing.lg },
  successContainer: { alignItems: 'center', paddingVertical: spacing.md },
  successIcon: { fontSize: 48, marginBottom: spacing.md },
  successTitle: { ...textPresets.h2, color: colors.text, marginBottom: spacing.sm },
  successText: { ...textPresets.bodyMedium, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
