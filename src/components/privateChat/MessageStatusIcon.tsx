import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { PrivateMessageStatus } from '../../types/privateChat';

interface MessageStatusIconProps {
  status: PrivateMessageStatus;
}

export const MessageStatusIcon: React.FC<MessageStatusIconProps> = ({ status }) => {
  switch (status) {
    case 'read':
      return <Text style={[styles.icon, { color: colors.accent }]}>✓✓</Text>;
    case 'delivered':
      return <Text style={[styles.icon, { color: colors.textMuted }]}>✓✓</Text>;
    case 'sent':
      return <Text style={[styles.icon, { color: colors.textMuted }]}>✓</Text>;
    case 'deleted':
      return null;
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  icon: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: 'bold',
  },
});
