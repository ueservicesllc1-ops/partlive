import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../../theme';
import { usePrivateConversations } from '../../hooks/usePrivateConversations';
import { ConversationListItem } from '../../components/privateChat/ConversationListItem';
import { EmptyConversationsState } from '../../components/privateChat/EmptyConversationsState';
import { useAuth } from '../../store/AuthContext';
import { MAIN_ROUTES } from '../../app/routes';

export const PrivateConversationsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { conversations, requests, loading, refresh, refreshing } = usePrivateConversations();
  const [searchQuery, setSearchQuery] = useState('');

  const currentUserId = user?.uid || '';

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Simple local filtering
  const filteredConversations = conversations.filter(c => {
    // Basic fallback: query filter can be enhanced on participant profiles or usernames.
    return c.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mensajes Privados</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate(MAIN_ROUTES.PRIVATE_CHAT_SETTINGS)}
        >
          <Text style={styles.settingsText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Message Requests Row if any exist */}
      {requests.length > 0 && (
        <TouchableOpacity
          style={styles.requestsBanner}
          onPress={() => navigation.navigate(MAIN_ROUTES.MESSAGE_REQUESTS)}
        >
          <View style={styles.requestsBannerLeft}>
            <Text style={styles.requestsIcon}>📨</Text>
            <Text style={styles.requestsBannerText}>Solicitudes de mensajes</Text>
          </View>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{requests.length}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Buscar conversaciones..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ConversationListItem
              conversation={item}
              currentUserId={currentUserId}
              onPress={() =>
                navigation.navigate(MAIN_ROUTES.PRIVATE_CHAT, {
                  conversationId: item.id,
                })
              }
            />
          )}
          contentContainerStyle={styles.listContent}
          onRefresh={refresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <EmptyConversationsState
              onPressDiscover={() => navigation.navigate(MAIN_ROUTES.SEARCH)}
            />
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  backText: {
    fontSize: 24,
    color: colors.text,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  settingsButton: {
    padding: spacing.xs,
  },
  settingsText: {
    fontSize: 22,
  },
  requestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  requestsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestsIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  requestsBannerText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  badgeContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
