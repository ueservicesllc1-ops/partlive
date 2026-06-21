import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LANGUAGES, LanguageOption } from '../../constants/languages';
import { colors, spacing, textPresets } from '../../theme';

interface LanguagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLanguage: (language: LanguageOption) => void;
  selectedLanguageCode?: string;
}

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  visible,
  onClose,
  onSelectLanguage,
  selectedLanguageCode,
}) => {
  const recommendedLanguages = LANGUAGES.filter(l => l.code === 'es' || l.code === 'en');
  const otherLanguages = LANGUAGES.filter(l => l.code !== 'es' && l.code !== 'en');

  const renderItem = ({ item }: { item: LanguageOption }) => {
    const isSelected = selectedLanguageCode === item.code;
    return (
      <TouchableOpacity
        style={[styles.itemRow, isSelected && styles.itemRowSelected]}
        onPress={() => {
          onSelectLanguage(item);
          onClose();
        }}
      >
        <View style={styles.textContainer}>
          <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
            {item.name}
          </Text>
          <Text style={styles.nativeName}>{item.nativeName}</Text>
        </View>
        {isSelected && <Text style={styles.checkIcon}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Seleccionar Idioma</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <Text style={styles.sectionTitle}>Recomendados</Text>
            {recommendedLanguages.map(lang => (
              <View key={lang.code}>
                {renderItem({ item: lang })}
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Todos los Idiomas</Text>
            {otherLanguages.map(lang => (
              <View key={lang.code}>
                {renderItem({ item: lang })}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '70%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#292440',
  },
  headerTitle: {
    ...textPresets.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1B30',
    paddingHorizontal: spacing.sm,
  },
  itemRowSelected: {
    backgroundColor: 'rgba(127, 85, 240, 0.05)',
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
  },
  itemName: {
    ...textPresets.bodyMedium,
    color: colors.text,
  },
  itemNameSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  nativeName: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontSize: 12,
  },
  checkIcon: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
