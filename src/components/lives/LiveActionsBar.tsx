import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LiveInputBar } from './LiveInputBar';
import { LiveLikeButton } from './LiveLikeButton';
import { spacing } from '../../theme';

interface LiveActionsBarProps {
  onSendMessage: (text: string) => void;
  onGiftPress: () => void;
  onLikePress: () => void;
  onMorePress: () => void;
  liked: boolean;
  likesCount: number;
  allowChat?: boolean;
  allowGifts?: boolean;
  isHost?: boolean;
}

export const LiveActionsBar: React.FC<LiveActionsBarProps> = ({
  onSendMessage,
  onGiftPress,
  onLikePress,
  onMorePress,
  liked,
  likesCount,
  allowChat = true,
  allowGifts = true,
  isHost = false,
}) => {
  return (
    <View style={styles.container}>
      <LiveInputBar 
        onSendMessage={onSendMessage} 
        disabled={!allowChat && !isHost} 
      />
      
      {allowGifts && (
        <TouchableOpacity style={styles.giftButton} onPress={onGiftPress} activeOpacity={0.8}>
          <Text style={styles.giftIcon}>🎁</Text>
        </TouchableOpacity>
      )}

      <LiveLikeButton liked={liked} onPress={onLikePress} count={likesCount} />

      <TouchableOpacity style={styles.moreButton} onPress={onMorePress} activeOpacity={0.8}>
        <Text style={styles.moreIcon}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
  },
  giftButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(233, 30, 99, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(233, 30, 99, 0.4)',
  },
  giftIcon: {
    fontSize: 20,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: 18,
  },
});
