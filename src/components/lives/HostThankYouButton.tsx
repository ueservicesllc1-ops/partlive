import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface HostThankYouButtonProps {
  lastSenderName?: string;
  onSendThankYou: (senderName: string) => void;
}

export const HostThankYouButton: React.FC<HostThankYouButtonProps> = ({
  lastSenderName,
  onSendThankYou,
}) => {
  if (!lastSenderName) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => onSendThankYou(lastSenderName)}
      activeOpacity={0.8}
    >
      <Text style={styles.buttonText}>
        💖 Agradecer a {lastSenderName}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255, 45, 85, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
