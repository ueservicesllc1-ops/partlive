import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { COUNTRIES, CountryOption } from '../../constants/countries';
import { colors, spacing, textPresets } from '../../theme';

interface CountryPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCountry: (country: CountryOption) => void;
  selectedCountryCode?: string;
}

export const CountryPickerModal: React.FC<CountryPickerModalProps> = ({
  visible,
  onClose,
  onSelectCountry,
  selectedCountryCode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: CountryOption }) => {
    const isSelected = selectedCountryCode === item.code;
    return (
      <TouchableOpacity
        style={[styles.itemRow, isSelected && styles.itemRowSelected]}
        onPress={() => {
          onSelectCountry(item);
          onClose();
        }}
      >
        <Text style={styles.itemEmoji}>{item.emoji}</Text>
        <Text style={[styles.itemName, isSelected && styles.itemNameSelected]}>
          {item.name}
        </Text>
        {isSelected && <Text style={styles.checkIcon}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Seleccionar País</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar país..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={item => item.code}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
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
    height: '80%',
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
  searchContainer: {
    padding: spacing.md,
  },
  searchInput: {
    backgroundColor: '#1E1B30',
    color: colors.text,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#292440',
  },
  listContent: {
    paddingHorizontal: spacing.md,
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
  itemEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  itemName: {
    ...textPresets.body,
    color: colors.text,
    flex: 1,
  },
  itemNameSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  checkIcon: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
