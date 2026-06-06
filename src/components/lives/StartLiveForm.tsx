import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';

interface StartLiveFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    category: string;
    language: string;
    country: string;
    allowChat: boolean;
    allowGifts: boolean;
    isPrivate: boolean;
  }) => void;
  loading?: boolean;
}

const CATEGORIES = ['Popular', 'Música', 'Fiesta', 'Juegos', 'Conversación', 'Talento'];

export const StartLiveForm: React.FC<StartLiveFormProps> = ({ onSubmit, loading = false }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Popular');
  const [language, setLanguage] = useState('es');
  const [country, setCountry] = useState('CL');
  const [allowChat, setAllowChat] = useState(true);
  const [allowGifts, setAllowGifts] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);

  const handleStart = () => {
    if (!title.trim()) {
      Alert.alert('Título Requerido', 'Por favor ingresa un título para tu live.');
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      language,
      country,
      allowChat,
      allowGifts,
      isPrivate,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.label}>Título del Live</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Concierto Acústico Nocturno 🎸"
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={title}
        onChangeText={setTitle}
        maxLength={60}
      />

      <Text style={styles.label}>Descripción (Opcional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Escribe algo sobre tu transmisión..."
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        maxLength={150}
      />

      <Text style={styles.label}>Categoría</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map(cat => {
          const isSelected = category === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBadge, isSelected && styles.categoryBadgeActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.settingsRow}>
        <Text style={styles.settingsLabel}>Permitir Chat en vivo</Text>
        <Switch
          value={allowChat}
          onValueChange={setAllowChat}
          trackColor={{ false: '#292440', true: colors.primary }}
          thumbColor={allowChat ? colors.accent : '#F4F3F4'}
        />
      </View>

      <View style={styles.settingsRow}>
        <Text style={styles.settingsLabel}>Permitir Regalos virtuales</Text>
        <Switch
          value={allowGifts}
          onValueChange={setAllowGifts}
          trackColor={{ false: '#292440', true: colors.primary }}
          thumbColor={allowGifts ? colors.accent : '#F4F3F4'}
        />
      </View>

      <View style={styles.settingsRow}>
        <Text style={styles.settingsLabel}>Transmitir en Privado</Text>
        <Switch
          value={isPrivate}
          onValueChange={setIsPrivate}
          trackColor={{ false: '#292440', true: colors.primary }}
          thumbColor={isPrivate ? colors.accent : '#F4F3F4'}
        />
      </View>

      <TouchableOpacity 
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
        onPress={handleStart}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.submitBtnText}>🔴 Iniciar Live Stream</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: '#1E1B30',
    borderWidth: 1.5,
    borderColor: '#292440',
    borderRadius: 12,
    color: '#FFF',
    padding: spacing.md,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: spacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E1B30',
    borderWidth: 1,
    borderColor: '#292440',
  },
  categoryBadgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingsLabel: {
    fontSize: 13,
    color: colors.text,
  },
  submitBtn: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
