import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';

export type RoomVisibility = 'public' | 'private' | 'vip';
export type RoomAccessType = 'open' | 'password' | 'approval' | 'invite_only';

interface RoomAccessTypeSelectorProps {
  visibility: RoomVisibility;
  onChangeVisibility: (val: RoomVisibility) => void;
  accessType: RoomAccessType;
  onChangeAccessType: (val: RoomAccessType) => void;
  password?: string;
  onChangePassword: (val: string) => void;
}

export const RoomAccessTypeSelector: React.FC<RoomAccessTypeSelectorProps> = ({
  visibility,
  onChangeVisibility,
  accessType,
  onChangeAccessType,
  password,
  onChangePassword,
}) => {
  const visOptions: { id: RoomVisibility; label: string; desc: string }[] = [
    { id: 'public', label: 'Pública', desc: 'Aparece en listas' },
    { id: 'private', label: 'Privada', desc: 'Acceso restringido' },
    { id: 'vip', label: 'VIP', desc: 'Solo miembros VIP' },
  ];

  const accessOptions: { id: RoomAccessType; label: string; desc: string }[] = [
    { id: 'open', label: 'Abierta', desc: 'Entrada libre' },
    { id: 'password', label: 'Clave', desc: 'Contraseña de acceso' },
    { id: 'approval', label: 'Aprobación', desc: 'Host autoriza' },
    { id: 'invite_only', label: 'Invitados', desc: 'Solo invitación' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Privacidad de la Sala *</Text>
      <View style={styles.row}>
        {visOptions.map(opt => {
          const isSelected = visibility === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => {
                onChangeVisibility(opt.id);
                // Adjust default access type
                if (opt.id === 'public') {
                  onChangeAccessType('open');
                } else if (opt.id === 'private' && accessType === 'open') {
                  onChangeAccessType('password');
                }
              }}
            >
              <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                {opt.label}
              </Text>
              <Text style={styles.cardDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {visibility !== 'public' && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={styles.sectionTitle}>Método de Acceso *</Text>
          <View style={styles.row}>
            {accessOptions.map(opt => {
              // Open access is only for public rooms
              if (opt.id === 'open') return null;
              const isSelected = accessType === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => onChangeAccessType(opt.id)}
                >
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.cardDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {visibility !== 'public' && accessType === 'password' && (
        <View style={styles.passwordContainer}>
          <Text style={styles.sectionTitle}>Contraseña de la Sala *</Text>
          <TextInput
            style={styles.input}
            placeholder="Clave de 4 dígitos o más"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            keyboardType="numeric"
            value={password}
            onChangeText={onChangePassword}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    ...textPresets.bodySmall,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: '#1E1B30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#292440',
    padding: spacing.md,
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(127, 85, 240, 0.1)',
  },
  cardTitle: {
    ...textPresets.bodySmall,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardTitleSelected: {
    color: colors.primary,
  },
  cardDesc: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
  },
  passwordContainer: {
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: '#1E1B30',
    color: colors.text,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#292440',
  },
});
