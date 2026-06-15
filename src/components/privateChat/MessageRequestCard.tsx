import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { MessageRequest } from '../../types/privateChat';
import { UserProfile } from '../../types/user';
import { getUserProfile } from '../../services/firebase/firestore/usersService';
import { Avatar } from '../Avatar';
import { toDateSafe } from '../../utils/firestoreDates';

interface MessageRequestCardProps {
  request: MessageRequest;
  onAccept: () => void;
  onReject: () => void;
}

export const MessageRequestCard: React.FC<MessageRequestCardProps> = ({
  request,
  onAccept,
  onReject,
}) => {
  const [sender, setSender] = useState<UserProfile | null>(null);

  useEffect(() => {
    getUserProfile(request.fromUserId).then(profile => {
      if (profile) setSender(profile);
    });
  }, [request.fromUserId]);

  const dateObj = toDateSafe(request.createdAt);
  const dateStr = dateObj ? dateObj.toLocaleDateString() : '';

  return (
    <View style={styles.container}>
      <View style={styles.userInfoRow}>
        <Avatar
          source={sender?.photoURL}
          size={48}
          level={sender?.level}
        />
        <View style={styles.nameContainer}>
          <Text style={styles.displayName}>
            {sender?.displayName || sender?.username || 'Usuario'}
          </Text>
          <Text style={styles.username}>@{sender?.username || 'user'}</Text>
        </View>
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>

      <View style={styles.previewContainer}>
        <Text style={styles.previewText} numberOfLines={2}>
          "{request.messagePreview || 'Hola'}"
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={onReject}>
          <Text style={styles.rejectButtonText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
          <Text style={styles.acceptButtonText}>Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  displayName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  username: {
    fontSize: 12,
    color: colors.textMuted,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  previewContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  previewText: {
    fontSize: 13,
    color: colors.text,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  rejectButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  acceptButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
