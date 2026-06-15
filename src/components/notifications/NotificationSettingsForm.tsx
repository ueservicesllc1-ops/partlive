import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { UserNotificationSettings } from '../../types/notification';

interface Props {
  settings: UserNotificationSettings;
  onUpdate: (updates: Partial<UserNotificationSettings>) => Promise<boolean>;
}

export const NotificationSettingsForm: React.FC<Props> = ({ settings, onUpdate }) => {
  const toggleSetting = (key: keyof UserNotificationSettings) => {
    onUpdate({ [key]: !settings[key] });
  };

  const rows: { key: keyof UserNotificationSettings; label: string; desc: string }[] = [
    {
      key: 'pushEnabled',
      label: 'Notificaciones Push Globales',
      desc: 'Activar o desactivar el envío de alertas directas a tu dispositivo.',
    },
    {
      key: 'liveStarted',
      label: 'Transmisiones en Vivo',
      desc: 'Avisar cuando creadores que sigues inicien un live.',
    },
    {
      key: 'gameInvites',
      label: 'Invitaciones a Juegos',
      desc: 'Alertar cuando un amigo te invite a jugar Trivia o PPT.',
    },
    {
      key: 'gifts',
      label: 'Regalos Recibidos',
      desc: 'Enviar notificación cuando recibes diamantes o semillas de regalo.',
    },
    {
      key: 'missions',
      label: 'Logros y Misiones',
      desc: 'Notificar al completar misiones y retos diarios.',
    },
    {
      key: 'payouts',
      label: 'Pagos y Retiros',
      desc: 'Avisos sobre la aprobación, procesamiento o rechazo de solicitudes de retiro.',
    },
    {
      key: 'vip',
      label: 'Suscripción VIP',
      desc: 'Informar sobre la expiración, renovación y activación del estatus VIP.',
    },
    {
      key: 'events',
      label: 'Eventos Especiales',
      desc: 'Alertar sobre el inicio de torneos o eventos temáticos globales.',
    },
    {
      key: 'moderation',
      label: 'Alertas de Moderación',
      desc: 'Mensajes de seguridad importantes, advertencias o logs de salas.',
    },
  ];

  return (
    <View style={styles.container}>
      {rows.map((row) => (
        <View key={row.key} style={styles.row}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.desc}>{row.desc}</Text>
          </View>
          <Switch
            value={!!settings[row.key]}
            onValueChange={() => toggleSetting(row.key)}
            trackColor={{ false: '#292440', true: colors.primary }}
            thumbColor={settings[row.key] ? '#FFF' : '#A6A2BC'}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1B30',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: '#292440',
  },
  infoCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  desc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 15,
  },
});
