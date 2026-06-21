import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { colors, spacing } from '../../theme';
import { COUNTRIES } from '../../constants/countries';
import { LANGUAGES } from '../../constants/languages';
import { ROOM_LIVE_CATEGORIES } from '../../constants/categories';
import { SearchFilter } from '../../types/search';

interface SearchFiltersSheetProps {
  visible: boolean;
  filters: SearchFilter;
  onClose: () => void;
  onApply: (filters: SearchFilter) => void;
  onReset: () => void;
}

export const SearchFiltersSheet: React.FC<SearchFiltersSheetProps> = ({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = React.useState<SearchFilter>({ ...filters });

  React.useEffect(() => {
    setLocalFilters({ ...filters });
  }, [filters, visible]);

  const updateFilter = <K extends keyof SearchFilter>(key: K, value: SearchFilter[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const sortByOptions: { code: SearchFilter['sortBy']; name: string }[] = [
    { code: 'relevance', name: 'Relevancia' },
    { code: 'popular', name: 'Populares' },
    { code: 'recent', name: 'Recientes' },
    { code: 'viewers', name: 'Espectadores' },
    { code: 'followers', name: 'Seguidores' },
    { code: 'gifts', name: 'Regalos' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Filtros Avanzados</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              {/* Sort By Section */}
              <Text style={styles.sectionTitle}>Ordenar por</Text>
              <View style={styles.optionsGrid}>
                {sortByOptions.map(option => {
                  const active = localFilters.sortBy === option.code;
                  return (
                    <TouchableOpacity
                      key={option.code}
                      onPress={() => updateFilter('sortBy', option.code)}
                      style={[styles.badge, active && styles.badgeActive]}
                    >
                      <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
                        {option.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Country Section */}
              <Text style={styles.sectionTitle}>País / Región</Text>
              <View style={styles.optionsGrid}>
                <TouchableOpacity
                  onPress={() => updateFilter('country', undefined)}
                  style={[styles.badge, !localFilters.country && styles.badgeActive]}
                >
                  <Text style={[styles.badgeText, !localFilters.country && styles.badgeTextActive]}>
                    Todos 🌍
                  </Text>
                </TouchableOpacity>
                {COUNTRIES.map(country => {
                  const active = localFilters.country === country.code;
                  return (
                    <TouchableOpacity
                      key={country.code}
                      onPress={() => updateFilter('country', country.code)}
                      style={[styles.badge, active && styles.badgeActive]}
                    >
                      <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
                        {country.emoji} {country.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Language Section */}
              <Text style={styles.sectionTitle}>Idioma</Text>
              <View style={styles.optionsGrid}>
                <TouchableOpacity
                  onPress={() => updateFilter('language', undefined)}
                  style={[styles.badge, !localFilters.language && styles.badgeActive]}
                >
                  <Text style={[styles.badgeText, !localFilters.language && styles.badgeTextActive]}>
                    Todos 💬
                  </Text>
                </TouchableOpacity>
                {LANGUAGES.map(lang => {
                  const active = localFilters.language === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => updateFilter('language', lang.code)}
                      style={[styles.badge, active && styles.badgeActive]}
                    >
                      <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
                        {lang.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Category Section */}
              <Text style={styles.sectionTitle}>Categoría</Text>
              <View style={styles.optionsGrid}>
                <TouchableOpacity
                  onPress={() => updateFilter('category', undefined)}
                  style={[styles.badge, !localFilters.category && styles.badgeActive]}
                >
                  <Text style={[styles.badgeText, !localFilters.category && styles.badgeTextActive]}>
                    Todas ✨
                  </Text>
                </TouchableOpacity>
                {ROOM_LIVE_CATEGORIES.map(category => {
                  const active = localFilters.category === category.code;
                  return (
                    <TouchableOpacity
                      key={category.code}
                      onPress={() => updateFilter('category', category.code)}
                      style={[styles.badge, active && styles.badgeActive]}
                    >
                      <Text style={[styles.badgeText, active && styles.badgeTextActive]}>
                        {category.icon} {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Actions Footer */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={onReset} style={styles.resetButton}>
                <Text style={styles.resetText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
                <Text style={styles.applyText}>Aplicar Filtros</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeIcon: {
    color: colors.textMuted,
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  badge: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  badgeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  badgeTextActive: {
    color: colors.text,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  resetButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginRight: spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 2,
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 24,
  },
  applyText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
