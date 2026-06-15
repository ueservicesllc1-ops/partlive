import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing } from '../../theme';
import { PkInvite } from '../../types/pk';
import { acceptPkInvite, rejectPkInvite } from '../../services/api/pkApi';

interface PkInviteToastProps {
  invite: PkInvite;
  toLiveId: string;
  onClose: () => void;
}

export const PkInviteToast: React.FC<PkInviteToastProps> = ({
  invite,
  toLiveId,
  onClose,
}) => {
  const [loadingAction, setLoadingAction] = useState<'accept' | 'reject' | null>(null);

  const handleAccept = async () => {
    try {
      setLoadingAction('accept');
      await acceptPkInvite(invite.id, toLiveId);
      onClose();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Error al aceptar la batalla PK');
      onClose();
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    try {
      setLoadingAction('reject');
      await rejectPkInvite(invite.id, 'No disponible');
      onClose();
    } catch (err) {
      console.error(err);
      onClose();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏆</Text>
        <View style={styles.textWrapper}>
          <Text style={styles.title}>¡Desafío PK Recibido!</Text>
          <Text style={styles.message}>Te invitan a una batalla 1vs1 de 3 min.</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.rejectBtn]}
          onPress={handleReject}
          disabled={loadingAction !== null}
        >
          {loadingAction === 'reject' ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (
            <Text style={styles.rejectText}>Rechazar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.acceptBtn]}
          onPress={handleAccept}
          disabled={loadingAction !== null}
        >
          {loadingAction === 'accept' ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={styles.acceptText}>Aceptar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: '#1E1B30',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  message: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    marginLeft: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: colors.border,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
  },
  rejectText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  acceptText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
