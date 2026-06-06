import React, { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, SafeAreaView, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { Button } from '../../components/Button';
import { useAuth } from '../../store/AuthContext';
import { getFriendlyAuthError } from '../../utils/firebaseAuthErrors';

export const LoginScreen = ({ navigation }: any) => {
  const { loginWithEmail, loginWithGoogle, loginAsGuest } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Por favor, ingresa tu email y contraseña.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (err: any) {
      setError(getFriendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'ASYNC_OP_IN_PROGRESS' && err.code !== 'SIGN_IN_CANCELLED') {
        setError(getFriendlyAuthError(err));
      }
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
            <Text style={styles.logoText}>Party<Text style={styles.liveSpan}>Live</Text></Text>
            <Text style={styles.subtitle}>Salas, lives, juegos y amigos</Text>
          </View>

          <View style={styles.formContainer}>
            <Button
              title="Continuar con Google"
              variant="secondary"
              size="large"
              onPress={handleGoogleSignIn}
              style={[styles.button, { backgroundColor: '#fff' }]}
              textStyle={{ color: '#000', fontWeight: 'bold' }}
            />
            
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>o con email</Text>
              <View style={styles.orLine} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Correo Electrónico"
              placeholderTextColor={colors.textDark}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(null); }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={colors.textDark}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(null); }}
              secureTextEntry
              autoCapitalize="none"
            />

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
              <View style={styles.actionContainer}>
                <Button title="Iniciar Sesión" variant="primary" size="large" onPress={handleSignIn} style={styles.button} />
                <Button title="Crear Cuenta Nueva" variant="outline" size="large" onPress={() => navigation.navigate('Register')} style={styles.button} />
              </View>
            )}
            
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.linkContainer}>
              <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {__DEV__ && (
              <TouchableOpacity onPress={loginAsGuest} style={styles.guestLinkContainer}>
                <Text style={styles.guestText}>Entrar como invitado (DEV)</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Al continuar, aceptas nuestras Condiciones de Servicio y Política de Privacidad.</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: spacing.xxl },
  header: { alignItems: 'center', marginTop: 40 },
  logoText: { ...textPresets.h1, fontSize: 44, fontWeight: 'bold', color: colors.text, letterSpacing: 1 },
  liveSpan: { color: colors.secondary },
  subtitle: { ...textPresets.bodyMedium, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, letterSpacing: 0.8 },
  formContainer: { width: '100%', marginVertical: spacing.xl, backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, borderWidth: 1.5, borderColor: colors.border },
  input: { backgroundColor: '#0F0C1B', color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, fontSize: 15 },
  errorContainer: { backgroundColor: 'rgba(255, 23, 68, 0.1)', borderRadius: 8, padding: spacing.md, borderWidth: 1, borderColor: colors.error, marginBottom: spacing.lg },
  errorText: { ...textPresets.bodySmall, color: colors.error, fontWeight: '600', textAlign: 'center' },
  actionContainer: { marginTop: spacing.xs },
  button: { marginBottom: spacing.md, width: '100%' },
  loader: { marginVertical: spacing.lg },
  linkContainer: { alignSelf: 'center', marginTop: spacing.xs, padding: spacing.xs },
  linkText: { ...textPresets.bodyMedium, color: colors.textMuted, fontWeight: '600' },
  guestLinkContainer: { alignSelf: 'center', marginTop: spacing.md, padding: spacing.xs },
  guestText: { ...textPresets.bodyMedium, color: colors.accent, fontWeight: 'bold' },
  footer: { alignItems: 'center', marginTop: spacing.xl },
  footerText: { ...textPresets.caption, color: colors.textDark, textAlign: 'center', lineHeight: 16 },
  orContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { ...textPresets.caption, color: colors.textMuted, marginHorizontal: spacing.md },
});
