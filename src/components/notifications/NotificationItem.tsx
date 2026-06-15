import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { AppNotification } from '../../types/notification';
import { NotificationIcon } from './NotificationIcon';

interface Props {
  notification: AppNotification;
  onPress: () => void;
}

export const NotificationItem: React.FC<Props> = ({ notification, onPress }) => {
  const isUnread = notification.status === 'unread';

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, isUnread && styles.unreadContainer]}
      activeOpacity={0.8}
    >
      <NotificationIcon type={notification.type} />
      
      <View style={styles.contentCol}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isUnread && styles.unreadText]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.time}>{formatTime(notification.createdAt)}</Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>
      
      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B30',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: '#292440',
    gap: spacing.md,
  },
  unreadContainer: {
    borderColor: colors.primary + '33',
    backgroundColor: '#231E3C',
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    paddingRight: 6,
  },
  unreadText: {
    color: '#FFF',
  },
  time: {
    fontSize: 10,
    color: colors.textMuted,
  },
  body: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
