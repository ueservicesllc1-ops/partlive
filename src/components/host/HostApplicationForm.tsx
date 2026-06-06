import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';

interface FormData {
  fullName: string;
  country: string;
  phone: string;
  socialLink: string;
  experience: string;
  whyHost: string;
}

interface Props {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

export const HostApplicationForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const [form, setForm] = useState<FormData>({
    fullName: '',
    country: '',
    phone: '',
    socialLink: '',
    experience: '',
    whyHost: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Nombre requerido.';
    if (!form.country.trim()) newErrors.country = 'País requerido.';
    if (form.experience.trim().length < 20) newErrors.experience = 'Mínimo 20 caracteres.';
    if (form.whyHost.trim().length < 20) newErrors.whyHost = 'Mínimo 20 caracteres.';
    if (form.socialLink.trim() && !/^https?:\/\//.test(form.socialLink.trim())) {
      newErrors.socialLink = 'Debe ser una URL válida (https://...)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await onSubmit(form);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo enviar la solicitud. Intenta de nuevo.');
    }
  };

  const setField = (key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.subtitle}>
        Cuéntanos sobre ti para unirte al programa de hosts de PartyLive.
      </Text>

      {/* Full Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Nombre completo *</Text>
        <TextInput
          style={[styles.input, errors.fullName && styles.inputError]}
          placeholder="Tu nombre real"
          placeholderTextColor={colors.textDark}
          value={form.fullName}
          onChangeText={v => setField('fullName', v)}
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>

      {/* Country */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>País *</Text>
        <TextInput
          style={[styles.input, errors.country && styles.inputError]}
          placeholder="Ej: Chile, México, Colombia"
          placeholderTextColor={colors.textDark}
          value={form.country}
          onChangeText={v => setField('country', v)}
        />
        {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
      </View>

      {/* Phone (optional) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Teléfono <Text style={styles.optional}>(opcional)</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="+56 9 XXXX XXXX"
          placeholderTextColor={colors.textDark}
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={v => setField('phone', v)}
        />
      </View>

      {/* Social link (optional) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Red social <Text style={styles.optional}>(opcional)</Text></Text>
        <TextInput
          style={[styles.input, errors.socialLink && styles.inputError]}
          placeholder="https://tiktok.com/@tú"
          placeholderTextColor={colors.textDark}
          autoCapitalize="none"
          keyboardType="url"
          value={form.socialLink}
          onChangeText={v => setField('socialLink', v)}
        />
        {errors.socialLink && <Text style={styles.errorText}>{errors.socialLink}</Text>}
      </View>

      {/* Experience */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Experiencia como creador *</Text>
        <TextInput
          style={[styles.input, styles.multiline, errors.experience && styles.inputError]}
          placeholder="Describe tu experiencia haciendo lives, salas o contenido online (mín. 20 caracteres)"
          placeholderTextColor={colors.textDark}
          value={form.experience}
          onChangeText={v => setField('experience', v)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{form.experience.length}/20 mín.</Text>
        {errors.experience && <Text style={styles.errorText}>{errors.experience}</Text>}
      </View>

      {/* Why host */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>¿Por qué quieres ser host? *</Text>
        <TextInput
          style={[styles.input, styles.multiline, errors.whyHost && styles.inputError]}
          placeholder="Cuéntanos qué tipo de contenido quieres hacer y cuál es tu objetivo (mín. 20 caracteres)"
          placeholderTextColor={colors.textDark}
          value={form.whyHost}
          onChangeText={v => setField('whyHost', v)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{form.whyHost.length}/20 mín.</Text>
        {errors.whyHost && <Text style={styles.errorText}>{errors.whyHost}</Text>}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
        accessibilityLabel="Enviar solicitud de host"
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Enviar Solicitud</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Al enviar esta solicitud aceptas las reglas del programa de hosts de PartyLive.
        No envíes información de pago ni documentos de identidad en este formulario.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  subtitle: {
    ...textPresets.bodyMedium,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  optional: {
    fontWeight: '400',
    color: colors.textMuted,
    fontSize: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 14,
  },
  inputError: {
    borderColor: colors.error,
  },
  multiline: {
    minHeight: 100,
    paddingTop: spacing.sm,
  },
  charCount: {
    fontSize: 10,
    color: colors.textDark,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 11,
    color: colors.error,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textDark,
    textAlign: 'center',
    lineHeight: 16,
  },
});
