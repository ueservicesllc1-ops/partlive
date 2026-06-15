import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserStatus } from '../../types';
import { colors, spacing } from '../../theme';
import { USER_STATUS_LABELS } from '../../constants/moderation';

interface UserStatusBannerProps {
  status: UserStatus;
  warningsCount?: number;
  suspendedUntil?: any; // Timestamp
}

export const UserStatusBanner: React.FC<UserStatusBannerProps> = ({
  status,
  warningsCount = 0,
  suspendedUntil,
}) => {
  if (status === 'active') return null;

  let bannerBg = colors.warning + '22'; // 13% opacity
  let borderColor = colors.warning;
  let textColor = colors.warning;
  let message = '';

  switch (status) {
    case 'warning':
      message = `⚠️ Tu cuenta tiene una advertencia activa (${warningsCount} en total). Por favor respeta las Normas de la Comunidad.`;
      break;
    case 'suspended':
      const dateText = suspendedUntil?.toDate
        ? suspendedUntil.toDate().toLocaleDateString()
        : 'pronto';
      bannerBg = colors.error + '22';
      borderColor = colors.error;
      textColor = colors.error;
      message = `🚫 Cuenta Suspendida temporalmente hasta el ${dateText}. Las funciones de chat, salas y lives están deshabilitadas.`;
      break;
    case 'banned':
      bannerBg = colors.error + '22';
      borderColor = colors.error;
      textColor = colors.error;
      message = `❌ Cuenta Baneada permanentemente por infringir las Normas de la Comunidad.`;
      break;
    case 'deleted':
      bannerBg = colors.textDark + '22';
      borderColor = colors.textDark;
      textColor = colors.textMuted;
      message = `🗑️ Esta cuenta ha sido eliminada.`;
      break;
  }

  return (
    <View style={[styles.container, { backgroundColor: bannerBg, borderColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
});
