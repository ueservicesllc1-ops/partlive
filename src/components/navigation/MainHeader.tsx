import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { useAuth } from '../../store/AuthContext';
import { formatCompactNumber } from '../../utils/formatNumbers';

interface MainHeaderProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showWallet?: boolean;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  onWalletPress?: () => void;
}

export const MainHeader = ({
  title,
  showSearch = true,
  showNotifications = true,
  showWallet = true,
  onSearchPress,
  onNotificationsPress,
  onWalletPress,
}: MainHeaderProps) => {
  const { userProfile, userWallet } = useAuth();
  const coinsBalance = userWallet ? userWallet.coins : (userProfile?.coins || 0);

  return (
    <View style={styles.container}>
      {title ? (
        <Text style={styles.title}>{title}</Text>
      ) : (
        <Text style={styles.logoText}>Party<Text style={styles.logoHighlight}>Live</Text></Text>
      )}

      <View style={styles.actions}>
        {showWallet && userProfile !== null && (
          <TouchableOpacity style={styles.walletBadge} onPress={onWalletPress}>
            <Text style={styles.walletIcon}>🪙</Text>
            <Text style={styles.walletText}>{formatCompactNumber(coinsBalance)}</Text>
          </TouchableOpacity>
        )}

        {showSearch && (
          <TouchableOpacity style={styles.iconButton} onPress={onSearchPress}>
            <Text style={styles.icon}>🔍</Text>
          </TouchableOpacity>
        )}

        {showNotifications && (
          <TouchableOpacity style={styles.iconButton} onPress={onNotificationsPress}>
            <Text style={styles.icon}>🔔</Text>
            {/* Mock unread badge */}
            <View style={styles.unreadBadge} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  logoText: {
    ...textPresets.h2,
    color: colors.text,
  },
  logoHighlight: {
    color: colors.primary,
  },
  title: {
    ...textPresets.h2,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  walletIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  walletText: {
    ...textPresets.bodySmall,
    color: '#FFB800',
    fontWeight: 'bold',
  },
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  icon: {
    fontSize: 22,
    color: colors.text,
  },
  unreadBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: colors.error,
    borderRadius: 4,
  },
});
