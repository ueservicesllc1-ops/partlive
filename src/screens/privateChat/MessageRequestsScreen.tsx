import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing } from '../../theme';
import { usePrivateConversations } from '../../hooks/usePrivateConversations';
import { MessageRequestCard } from '../../components/privateChat/MessageRequestCard';
import { MAIN_ROUTES } from '../../app/routes';

export const MessageRequestsScreen = ({ navigation }: any) => {
  const { requests, loading, acceptRequest, rejectRequest } = usePrivateConversations();

  const handleAccept = async (conversationId: string) => {
    try {
      await acceptRequest(conversationId);
      Alert.alert('Solicitud aceptada', 'Ahora puedes chatear con este usuario.', [
        {
          text: 'Ir al chat',
          onPress: () =>
            navigation.replace(MAIN_ROUTES.PRIVATE_CHAT, {
              conversationId,
            }),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo aceptar la solicitud.');
    }
  };

  const handleReject = async (conversationId: string) => {
    try {
      await rejectRequest(conversationId);
      Alert.alert('Rechazada', 'Solicitud rechazada correctamente.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo rechazar la solicitud.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Solicitudes de mensajes</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.introContainer}>
        <Text style={styles.introText}>
          Estas personas no son tus seguidores ni amigos. Sus mensajes no se mostrarán en tu lista principal hasta que aceptes sus solicitudes.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MessageRequestCard
              request={item}
              onAccept={() => handleAccept(item.conversationId)}
              onReject={() => handleReject(item.conversationId)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📬</Text>
              <Text style={styles.emptyTitle}>Sin solicitudes</Text>
              <Text style={styles.emptyDescription}>
                No tienes solicitudes de mensajes pendientes. ¡Todo al día!
              </Text>
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
  introContainer: {
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
  },
  introText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    paddingVertical: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
