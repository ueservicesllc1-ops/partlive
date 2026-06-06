import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Text, TextInput } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { Button } from '../Button';

interface CreateRoomFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    category: string;
    language: string;
    country: string;
    maxSpeakers: number;
    maxUsers: number;
    isPrivate: boolean;
    password?: string;
    tags: string[];
  }) => void;
  loading: boolean;
}

export const CreateRoomForm: React.FC<CreateRoomFormProps> = ({ onSubmit, loading }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Popular');
  const [language, setLanguage] = useState('es');
  const [country, setCountry] = useState('MX');
  const [maxSpeakers, setMaxSpeakers] = useState(8);
  const [maxUsers, setMaxUsers] = useState(200);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const CATEGORIES = ['Popular', 'Música', 'Fiesta', 'Juegos', 'Karaoke', 'Amistad', 'Debate'];

  const handleSubmit = () => {
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      language,
      country,
      maxSpeakers,
      maxUsers,
      isPrivate,
      password: isPrivate ? password : '',
      tags,
    });
  };

  return (
    <ScrollView style={styles.form} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.label}>Título de la Sala *</Text>
      <TextInput
        style={styles.input}
        placeholder="ej: Noche de Karaoke Latino 🎤"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="¿De qué trata tu sala?"
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Categoría</Text>
      <View style={styles.categoriesRow}>
        {CATEGORIES.map(cat => (
          <Button
            key={cat}
            title={cat}
            variant={category === cat ? 'primary' : 'secondary'}
            size="small"
            style={styles.categoryBtn}
            onPress={() => setCategory(cat)}
          />
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.halfCol}>
          <Text style={styles.label}>Idioma</Text>
          <TextInput
            style={styles.input}
            placeholder="es"
            placeholderTextColor={colors.textMuted}
            value={language}
            onChangeText={setLanguage}
          />
        </View>
        <View style={styles.halfCol}>
          <Text style={styles.label}>País (Código)</Text>
          <TextInput
            style={styles.input}
            placeholder="MX"
            placeholderTextColor={colors.textMuted}
            value={country}
            onChangeText={setCountry}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfCol}>
          <Text style={styles.label}>Max Micrófonos</Text>
          <TextInput
            style={styles.input}
            placeholder="8"
            placeholderTextColor={colors.textMuted}
            value={maxSpeakers.toString()}
            keyboardType="numeric"
            onChangeText={(text: string) => setMaxSpeakers(parseInt(text) || 8)}
          />
        </View>
        <View style={styles.halfCol}>
          <Text style={styles.label}>Max Oyentes</Text>
          <TextInput
            style={styles.input}
            placeholder="200"
            placeholderTextColor={colors.textMuted}
            value={maxUsers.toString()}
            keyboardType="numeric"
            onChangeText={(text: string) => setMaxUsers(parseInt(text) || 200)}
          />
        </View>
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.label}>Sala Privada</Text>
          <Text style={styles.switchSub}>Requiere contraseña para ingresar</Text>
        </View>
        <Switch
          value={isPrivate}
          onValueChange={setIsPrivate}
          trackColor={{ false: '#292440', true: colors.primary }}
          thumbColor={isPrivate ? colors.secondary : '#FFF'}
        />
      </View>

      {isPrivate && (
        <View>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Contraseña de la sala"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
      )}

      <Text style={styles.label}>Etiquetas (Separadas por comas)</Text>
      <TextInput
        style={styles.input}
        placeholder="musica, karaoke, chill"
        placeholderTextColor={colors.textMuted}
        value={tagsInput}
        onChangeText={setTagsInput}
      />

      <Button
        title={loading ? 'Creando Sala...' : 'Crear Sala'}
        variant="primary"
        style={styles.submitBtn}
        onPress={handleSubmit}
        disabled={loading || !title.trim()}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...textPresets.bodySmall,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#1E1B30',
    color: colors.text,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#292440',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  categoryBtn: {
    paddingHorizontal: spacing.sm,
    height: 36,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  halfCol: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: '#1E1B30',
    padding: spacing.md,
    borderRadius: 12,
  },
  switchSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
