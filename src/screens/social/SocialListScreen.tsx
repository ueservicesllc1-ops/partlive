import React, { useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { useSocialLists, SocialListType } from '../../hooks/useSocialLists';
import { SocialUserListItem } from '../../components/social/SocialUserListItem';
import { MAIN_ROUTES } from '../../app/routes';

export const SocialListScreen = ({ route, navigation }: any) => {
  const { userId, listType, title } = route.params || {};
  const { users, loading, error, refresh } = useSocialLists(userId, listType as SocialListType);
  const [searchQuery, setSearchQuery] = useState('');

  const getScreenTitle = () => {
    if (title) return title;
    switch (listType) {
      case 'followers':
        return 'Seguidores';
      case 'following':
        return 'Siguiendo';
      case 'friends':
        return 'Amigos';
      default:
        return 'Lista Social';
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      user.displayName.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o usuario..."
          placeholderTextColor={colors.textDark}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* List content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.uid}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={refresh}
          renderItem={({ item }) => (
            <SocialUserListItem
              user={item}
              onPressProfile={() =>
                navigation.navigate(MAIN_ROUTES.PUBLIC_PROFILE, { userId: item.uid })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No se encontraron usuarios.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    ...textPresets.header,
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  searchContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: {
    padding: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
export default SocialListScreen;
