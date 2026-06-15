import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { usePrivateChat } from '../../hooks/usePrivateChat';
import { useAuth } from '../../store/AuthContext';
import { PrivateChatHeader } from '../../components/privateChat/PrivateChatHeader';
import { MessageBubble } from '../../components/privateChat/MessageBubble';
import { PrivateChatInput } from '../../components/privateChat/PrivateChatInput';
import { PrivateChatOptionsModal } from '../../components/privateChat/PrivateChatOptionsModal';
import { MAIN_ROUTES } from '../../app/routes';
import privateChatApi from '../../services/api/privateChatApi';

export const PrivateChatScreen = ({ route, navigation }: any) => {
  const { conversationId, targetUserId } = route.params || {};
  const { user } = useAuth();
  
  const {
    conversation,
    messages,
    otherUser,
    loading,
    sending,
    error,
    text,
    setText,
    sendText,
    sendEmoji,
    reportMessage,
    blockUser,
  } = usePrivateChat({ conversationId, targetUserId });

  const [optionsVisible, setOptionsVisible] = useState(false);
  
  const currentUserId = user?.uid || '';
  const isMuted = conversation?.mutedBy?.includes(currentUserId) || false;

  const handleToggleMute = async () => {
    if (!conversation) return;
    try {
      if (isMuted) {
        await privateChatApi.unmuteConversation(conversation.id);
        Alert.alert('Silencio', 'Notificaciones de chat reactivadas.');
      } else {
        await privateChatApi.muteConversation(conversation.id);
        Alert.alert('Silencio', 'Chat silenciado correctamente.');
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo cambiar el estado de silencio.');
    }
  };

  const handleArchive = async () => {
    if (!conversation) return;
    try {
      await privateChatApi.archiveConversation(conversation.id);
      Alert.alert('Archivar', 'Conversación archivada correctamente.', [
        { text: 'Aceptar', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'No se pudo archivar la conversación.');
    }
  };

  const handleBlockUser = async () => {
    Alert.alert(
      'Bloquear usuario',
      '¿Estás seguro de que deseas bloquear a este usuario? No podrá volver a enviarte mensajes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser();
              Alert.alert('Bloqueado', 'Usuario bloqueado correctamente.', [
                { text: 'Aceptar', onPress: () => navigation.goBack() }
              ]);
            } catch (err) {
              Alert.alert('Error', 'No se pudo bloquear al usuario.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!conversation) return;
    try {
      await privateChatApi.deleteMessageForMe(messageId, conversation.id);
    } catch (err) {
      Alert.alert('Error', 'No se pudo eliminar el mensaje.');
    }
  };

  const handleReportMessage = async (messageId: string) => {
    Alert.alert(
      'Reportar mensaje',
      'Selecciona la razón del reporte.',
      [
        { text: 'Spam', onPress: () => sendReport(messageId, 'spam') },
        { text: 'Lenguaje ofensivo', onPress: () => sendReport(messageId, 'offensive_language') },
        { text: 'Acoso', onPress: () => sendReport(messageId, 'harassment') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const sendReport = async (messageId: string, reason: string) => {
    try {
      await reportMessage(messageId, reason, 'Reportado desde el chat móvil.');
      Alert.alert('Reportado', 'Mensaje reportado para revisión de moderación.');
    } catch (err) {
      Alert.alert('Error', 'No se pudo procesar el reporte.');
    }
  };

  const handleAcceptRequest = async () => {
    if (!conversation) return;
    try {
      await privateChatApi.acceptMessageRequest(conversation.id);
      Alert.alert('Aceptado', 'Solicitud aceptada. Ahora puedes chatear.');
    } catch (err) {
      Alert.alert('Error', 'No se pudo aceptar la solicitud.');
    }
  };

  const handleRejectRequest = async () => {
    if (!conversation) return;
    try {
      await privateChatApi.rejectMessageRequest(conversation.id);
      Alert.alert('Rechazada', 'Solicitud rechazada.', [
        { text: 'Aceptar', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'No se pudo rechazar la solicitud.');
    }
  };

  // Render requests banners
  const isPending = conversation?.status === 'pending';
  const wasRequestedByMe = conversation?.requestedBy === currentUserId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <PrivateChatHeader
        otherUser={otherUser}
        onBack={() => navigation.goBack()}
        onViewProfile={() => {
          if (otherUser) {
            navigation.navigate(MAIN_ROUTES.PUBLIC_PROFILE, { userId: otherUser.uid });
          }
        }}
        onOptions={() => setOptionsVisible(true)}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                currentUserId={currentUserId}
                onDeleteMessage={() => handleDeleteMessage(item.id)}
                onReportMessage={() => handleReportMessage(item.id)}
              />
            )}
            contentContainerStyle={styles.messagesList}
            inverted
          />
        )}

        {/* Requests handling banner */}
        {isPending && (
          <View style={styles.bannerContainer}>
            {wasRequestedByMe ? (
              <Text style={styles.bannerText}>
                Esperando que el destinatario acepte tu solicitud de mensaje.
              </Text>
            ) : (
              <View style={styles.receiverBanner}>
                <Text style={styles.receiverBannerText}>
                  ¿Aceptas esta solicitud de mensaje?
                </Text>
                <View style={styles.bannerActions}>
                  <TouchableOpacity style={[styles.bannerBtn, styles.btnReject]} onPress={handleRejectRequest}>
                    <Text style={styles.btnText}>Rechazar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.bannerBtn, styles.btnAccept]} onPress={handleAcceptRequest}>
                    <Text style={styles.btnText}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Text input, only active when not pending or if current user sent it (pending status still allows sender to add context but we block once limit is hit) */}
        {(!isPending || wasRequestedByMe) && (
          <PrivateChatInput
            value={text}
            onChangeText={setText}
            onSend={sendText}
            onSendEmoji={sendEmoji}
            sending={sending}
          />
        )}
      </KeyboardAvoidingView>

      <PrivateChatOptionsModal
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onArchive={handleArchive}
        onBlock={handleBlockUser}
        onReport={() => {
          if (messages.length > 0) {
            handleReportMessage(messages[0].id);
          } else {
            Alert.alert('Reportar', 'No hay mensajes para reportar.');
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingVertical: spacing.md,
  },
  bannerContainer: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bannerText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  receiverBanner: {
    width: '100%',
    alignItems: 'center',
  },
  receiverBannerText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bannerBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnReject: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnAccept: {
    backgroundColor: colors.primary,
  },
  btnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
