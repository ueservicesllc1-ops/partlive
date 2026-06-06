import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, SafeAreaView, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Keyboard
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { colors, spacing, textPresets } from '../../theme';
import { Button } from '../../components/Button';
import { useAuth } from '../../store/AuthContext';
import { getFriendlyAuthError } from '../../utils/firebaseAuthErrors';
import { validateUsernameFormat, isUsernameAvailable } from '../../services/firebase/firestore/usernameService';

export const RegisterScreen = ({ navigation }: any) => {
  const { registerWithWizard } = useAuth();
  const pagerRef = useRef<PagerView>(null);
  
  const [step, setStep] = useState(0);
  
  // Form Data
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToNextStep = () => {
    Keyboard.dismiss();
    setError(null);
    if (step === 0) {
      if (!displayName.trim()) return setError('Por favor, ingresa tu nombre.');
      pagerRef.current?.setPage(1);
    } else if (step === 1) {
      const v = validateUsernameFormat(username);
      if (!v.valid) return setError(v.error!);
      pagerRef.current?.setPage(2);
    }
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    setError(null);
    
    if (!email.trim() || !email.includes('@')) return setError('Ingresa un correo válido.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (!termsAccepted) return setError('Debes aceptar los términos y condiciones.');

    setLoading(true);
    try {
      const available = await isUsernameAvailable(username);
      if (!available) {
        setLoading(false);
        pagerRef.current?.setPage(1); // Go back to username step
        return setError('Ese nombre de usuario ya está en uso. Intenta otro.');
      }

      await registerWithWizard(email.trim(), password, {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        profileCompleted: true
      });
      // Navegación automática a MainTabs por AuthContext
    } catch (err: any) {
      setError(getFriendlyAuthError(err));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step === 0 ? navigation.goBack() : pagerRef.current?.setPage(step - 1)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, step >= 0 && styles.progressDotActive]} />
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <PagerView
          style={styles.pagerView}
          initialPage={0}
          ref={pagerRef}
          scrollEnabled={false} // Disable swipe, force buttons
          onPageSelected={(e) => setStep(e.nativeEvent.position)}
        >
          
          {/* STEP 1: Nombre */}
          <View key="1" style={styles.page}>
            <View style={styles.pageContent}>
              <Text style={styles.title}>¿Cómo te llamas?</Text>
              <Text style={styles.subtitle}>Este es el nombre que todos verán en tu perfil.</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor={colors.textDark}
                value={displayName}
                onChangeText={(t) => { setDisplayName(t); setError(null); }}
                autoFocus
              />
            </View>
            <Button title="Continuar" variant="primary" size="large" onPress={goToNextStep} style={styles.button} />
          </View>

          {/* STEP 2: Username */}
          <View key="2" style={styles.page}>
            <View style={styles.pageContent}>
              <Text style={styles.title}>Crea tu @usuario</Text>
              <Text style={styles.subtitle}>Debe ser único, sin espacios y en minúsculas.</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Ej: juan_perez99"
                placeholderTextColor={colors.textDark}
                value={username}
                onChangeText={(t) => { setUsername(t); setError(null); }}
                autoCapitalize="none"
              />
            </View>
            <Button title="Continuar" variant="primary" size="large" onPress={goToNextStep} style={styles.button} />
          </View>

          {/* STEP 3: Email y Password */}
          <View key="3" style={styles.page}>
            <View style={styles.pageContent}>
              <Text style={styles.title}>Protege tu cuenta</Text>
              <Text style={styles.subtitle}>Ingresa tu correo y una contraseña segura.</Text>
              
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.textDark}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextInput
                style={styles.input}
                placeholder="Contraseña (mín 6 caracteres)"
                placeholderTextColor={colors.textDark}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(null); }}
                secureTextEntry
              />

              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => { setTermsAccepted(!termsAccepted); setError(null); }}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Acepto Términos y Condiciones</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
              <Button title="Crear mi cuenta" variant="primary" size="large" onPress={handleRegister} style={styles.button} />
            )}
          </View>

        </PagerView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md },
  backButton: { paddingVertical: spacing.sm, paddingRight: spacing.lg },
  backButtonText: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
  progressContainer: { flexDirection: 'row', gap: 8 },
  progressDot: { width: 30, height: 6, borderRadius: 3, backgroundColor: colors.border },
  progressDotActive: { backgroundColor: colors.primary },
  pagerView: { flex: 1 },
  page: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, justifyContent: 'space-between' },
  pageContent: { flex: 1, paddingTop: spacing.xl },
  title: { ...textPresets.h1, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...textPresets.bodyMedium, color: colors.textMuted, marginBottom: spacing.xl },
  input: { backgroundColor: '#0F0C1B', color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.lg, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, fontSize: 16 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  checkboxLabel: { ...textPresets.bodyMedium, color: colors.text },
  errorContainer: { marginHorizontal: spacing.xl, backgroundColor: 'rgba(255, 23, 68, 0.1)', borderRadius: 8, padding: spacing.md, borderWidth: 1, borderColor: colors.error, marginBottom: spacing.md },
  errorText: { ...textPresets.bodySmall, color: colors.error, fontWeight: '600', textAlign: 'center' },
  button: { width: '100%' },
  loader: { marginVertical: spacing.lg },
});
