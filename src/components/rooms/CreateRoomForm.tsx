import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { Button } from '../Button';
import { RoomCategoryPicker } from './RoomCategoryPicker';
import { RoomAccessTypeSelector, RoomVisibility, RoomAccessType } from './RoomAccessTypeSelector';
import { MaxMicSelector } from './MaxMicSelector';
import { UnlimitedListenersInfo } from './UnlimitedListenersInfo';
import { CountryPickerModal } from './CountryPickerModal';
import { LanguagePickerModal } from './LanguagePickerModal';
import { CountryOption } from '../../constants/countries';
import { LanguageOption } from '../../constants/languages';
import { RoomCategoryType } from '../../constants/roomCategories';

interface CreateRoomFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    category: RoomCategoryType;
    countryCode?: string;
    countryName?: string;
    languageCode?: string;
    languageName?: string;
    visibility: RoomVisibility;
    accessType: RoomAccessType;
    password?: string;
    maxMics: number;
    listenersUnlimited: boolean;
    tags: string[];
  }) => void;
  loading: boolean;
}

export const CreateRoomForm: React.FC<CreateRoomFormProps> = ({ onSubmit, loading }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RoomCategoryType>('music');
  
  const [country, setCountry] = useState<CountryOption>({ code: 'EC', name: 'Ecuador', emoji: '🇪🇨' });
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  const [language, setLanguage] = useState<LanguageOption>({ code: 'es', name: 'Español', nativeName: 'Español' });
  const [langModalVisible, setLangModalVisible] = useState(false);

  const [visibility, setVisibility] = useState<RoomVisibility>('public');
  const [accessType, setAccessType] = useState<RoomAccessType>('open');
  const [password, setPassword] = useState('');
  const [maxMics, setMaxMics] = useState(8);
  const [tagsInput, setTagsInput] = useState('');

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
      countryCode: country.code,
      countryName: country.name,
      languageCode: language.code,
      languageName: language.name,
      visibility,
      accessType,
      password: accessType === 'password' ? password : '',
      maxMics,
      listenersUnlimited: true,
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
        maxLength={60}
        value={title}
        onChangeText={setTitle}
      />
      <Text style={styles.charCount}>{title.length}/60</Text>

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="¿De qué trata tu sala?"
        placeholderTextColor={colors.textMuted}
        maxLength={200}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />
      <Text style={styles.charCount}>{description.length}/200</Text>

      <RoomCategoryPicker
        selectedCategory={category}
        onSelectCategory={setCategory}
      />

      <View style={styles.row}>
        <View style={styles.halfCol}>
          <Text style={styles.label}>Idioma *</Text>
          <TouchableOpacity
            style={styles.pickerSelector}
            onPress={() => setLangModalVisible(true)}
          >
            <Text style={styles.pickerText}>{language.name}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.halfCol}>
          <Text style={styles.label}>País *</Text>
          <TouchableOpacity
            style={styles.pickerSelector}
            onPress={() => setCountryModalVisible(true)}
          >
            <Text style={styles.pickerText}>
              {country.emoji} {country.name}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <RoomAccessTypeSelector
        visibility={visibility}
        onChangeVisibility={setVisibility}
        accessType={accessType}
        onChangeAccessType={setAccessType}
        password={password}
        onChangePassword={setPassword}
      />

      <MaxMicSelector
        maxMics={maxMics}
        onSelectMaxMics={setMaxMics}
      />

      <UnlimitedListenersInfo />

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

      <CountryPickerModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
        selectedCountryCode={country.code}
        onSelectCountry={setCountry}
      />

      <LanguagePickerModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
        selectedLanguageCode={language.code}
        onSelectLanguage={setLanguage}
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
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#292440',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  halfCol: {
    flex: 1,
  },
  pickerSelector: {
    backgroundColor: '#1E1B30',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292440',
    justifyContent: 'center',
  },
  pickerText: {
    ...textPresets.bodySmall,
    color: colors.text,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
});
