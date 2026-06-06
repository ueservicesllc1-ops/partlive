import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, StatusBar, SafeAreaView, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { Button } from '../../components/Button';
import { useAuth } from '../../store/AuthContext';
import { validateUsernameFormat, isUsernameAvailable } from '../../services/firebase/firestore/usernameService';

export const ProfileSetupScreen = () => {
  const { user, userProfile, completeProfile, logout } = useAuth();
  
  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || '');
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.displayName) {
      setDisplayName(userProfile.displayName);
    }
  }, [userProfile]);

  const handleSave = async () => {
    setError(null);
    
    if (!displayName.trim()) return setError('El nombre público es requerido.');
    
    const usernameValidation = validateUsernameFormat(username);
    if (!usernameValidation.valid) return setError(usernameValidation.error!);

    setLoading(true);
    try {
      const available = await isUsernameAvailable(username);
      if (!available) {
        setLoading(false);
        return setError('Ese nombre de usuario ya está en uso. Intenta otro.');
      }

      await completeProfile({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        country: country.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      // Context updates, UI automatically routes to MainTabs
    } catch (err: any) {
      setError(err.message || 'Error al guardar el perfil.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Text style={styles.title}>Completa tu Perfil</Text>
            <Text style={styles.subtitle}>
              Estás a un solo paso de unirte a PartyLive. Elige un nombre de usuario único.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Nombre Público</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor={colors.textDark}
              value={displayName}
              onChangeText={(t) => { setDisplayName(t); setError(null); }}
            />

            <Text style={styles.label}>Nombre de Usuario (Único)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: juan_perez99"
              placeholderTextColor={colors.textDark}
              value={username}
              onChangeText={(t) => { setUsername(t); setError(null); }}
              autoCapitalize="none"
            />

            <Text style={styles.label}>País (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: México"
              placeholderTextColor={colors.textDark}
              value={country}
              onChangeText={setCountry}
            />

            <Text style={styles.label}>Biografía (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Cuéntanos un poco sobre ti..."
              placeholderTextColor={colors.textDark}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
              <View>
                <Button title="Guardar y Continuar" variant="primary" size="large" onPress={handleSave} style={styles.button} />
                <Button title="Cerrar Sesión" variant="outline" size="medium" onPress={logout} style={{ marginTop: spacing.lg }} />
              </View>
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
  title: { ...textPresets.h1, color: colors.text },
  subtitle: { ...textPresets.bodyMedium, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 22 },
  formContainer: { width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, borderWidth: 1.5, borderColor: colors.border, marginTop: spacing.md },
  label: { ...textPresets.bodySmall, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: '600' },
  input: { backgroundColor: '#0F0C1B', color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, fontSize: 15 },
  textArea: { height: 80, textAlignVertical: 'top' },
  errorContainer: { backgroundColor: 'rgba(255, 23, 68, 0.1)', borderRadius: 8, padding: spacing.md, borderWidth: 1, borderColor: colors.error, marginBottom: spacing.lg },
  errorText: { ...textPresets.bodySmall, color: colors.error, fontWeight: '600', textAlign: 'center' },
  button: { width: '100%', marginTop: spacing.sm },
  loader: { marginVertical: spacing.lg },
});
