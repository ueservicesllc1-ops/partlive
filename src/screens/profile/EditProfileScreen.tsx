import React, { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, SafeAreaView, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Image
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { Button } from '../../components/Button';
import { useAuth } from '../../store/AuthContext';
import { updateEditableProfile, updateProfilePhoto } from '../../services/firebase/firestore/usersService';
import { validateUsernameFormat } from '../../services/firebase/firestore/usernameService';
import { pickProfileImage } from '../../utils/imagePicker';
import { uploadProfilePhoto } from '../../services/uploads/uploadService';
import { ScreenLoading } from '../../components/ScreenLoading';

export const EditProfileScreen = ({ navigation }: any) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  
  if (!user || !userProfile) return null;

  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [username, setUsername] = useState(userProfile.username || '');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [country, setCountry] = useState(userProfile.country || '');
  const [photoURL, setLocalPhotoURL] = useState(userProfile.photoURL || '');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const image = await pickProfileImage();
      if (image) {
        setLoading(true);
        // Upload immediately or hold in state? We will upload immediately.
        const result = await uploadProfilePhoto(image.uri, image.type, image.fileName);
        await updateProfilePhoto(user.uid, result.publicUrl);
        setLocalPhotoURL(result.publicUrl);
        await refreshUserProfile();
        setLoading(false);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Error al cambiar la foto');
    }
  };

  const handleSave = async () => {
    setError(null);
    
    if (!displayName.trim()) return setError('El nombre público es requerido.');
    
    const usernameValidation = validateUsernameFormat(username);
    if (!usernameValidation.valid) return setError(usernameValidation.error!);

    if (bio.length > 160) return setError('La biografía no debe superar los 160 caracteres.');

    setLoading(true);
    try {
      await updateEditableProfile(user.uid, {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim() || undefined,
        country: country.trim() || undefined,
      });
      await refreshUserProfile();
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el perfil.');
      setLoading(false);
    }
  };

  if (loading) {
    return <ScreenLoading message="Guardando cambios..." />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Editar Perfil</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.photoSection}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <TouchableOpacity onPress={handlePickImage} style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Cambiar Foto</Text>
            </TouchableOpacity>
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

            <Text style={styles.label}>Nombre de Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: juan_perez99"
              placeholderTextColor={colors.textDark}
              value={username}
              onChangeText={(t) => { setUsername(t); setError(null); }}
              autoCapitalize="none"
            />

            <Text style={styles.label}>País</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: México"
              placeholderTextColor={colors.textDark}
              value={country}
              onChangeText={setCountry}
            />

            <Text style={styles.label}>Biografía ({bio.length}/160)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Cuéntanos un poco sobre ti..."
              placeholderTextColor={colors.textDark}
              value={bio}
              onChangeText={(t) => { setBio(t); setError(null); }}
              multiline
              maxLength={160}
            />

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
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
  scrollContainer: { flexGrow: 1, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { paddingVertical: spacing.sm },
  backButtonText: { ...textPresets.bodyMedium, color: colors.textMuted },
  title: { ...textPresets.h3, color: colors.text },
  saveButton: { paddingVertical: spacing.sm },
  saveButtonText: { ...textPresets.bodyMedium, color: colors.primary, fontWeight: 'bold' },
  photoSection: { alignItems: 'center', marginVertical: spacing.xl },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: colors.primary },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.border },
  avatarInitials: { ...textPresets.h1, color: colors.primary },
  changePhotoButton: { marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  changePhotoText: { ...textPresets.bodySmall, color: colors.text, fontWeight: 'bold' },
  formContainer: { paddingHorizontal: spacing.xl },
  label: { ...textPresets.bodySmall, color: colors.textMuted, marginBottom: spacing.xs, fontWeight: '600' },
  input: { backgroundColor: colors.surface, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, fontSize: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  errorContainer: { backgroundColor: 'rgba(255, 23, 68, 0.1)', borderRadius: 8, padding: spacing.md, borderWidth: 1, borderColor: colors.error, marginBottom: spacing.lg },
  errorText: { ...textPresets.bodySmall, color: colors.error, fontWeight: '600', textAlign: 'center' },
});
