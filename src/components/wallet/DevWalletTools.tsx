import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Button } from '../Button';
import { colors, spacing, textPresets } from '../../theme';

interface DevWalletToolsProps {
  onCreditCoins: (amount: number, description: string) => Promise<void>;
  onCreditDiamonds: (amount: number, description: string) => Promise<void>;
  loading: boolean;
}

export const DevWalletTools: React.FC<DevWalletToolsProps> = ({
  onCreditCoins,
  onCreditDiamonds,
  loading,
}) => {
  const [submitting, setSubmitting] = useState(false);

  const handleCoinsAdd = async () => {
    setSubmitting(true);
    try {
      await onCreditCoins(10000, 'Test coins credit');
      Alert.alert('Éxito', 'Se agregaron 10,000 monedas de prueba a tu billetera.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo agregar saldo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiamondsAdd = async () => {
    setSubmitting(true);
    try {
      await onCreditDiamonds(5000, 'Test diamonds credit');
      Alert.alert('Éxito', 'Se agregaron 5,000 diamantes de prueba a tu billetera.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo agregar saldo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛠️ Herramientas de Desarrollo</Text>
      <Text style={styles.subtitle}>Usa estas herramientas para simular saldo en desarrollo.</Text>

      {loading || submitting ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} />
      ) : (
        <View style={styles.btnRow}>
          <Button
            title="+10k Monedas"
            variant="primary"
            style={styles.btn}
            onPress={handleCoinsAdd}
          />
          <Button
            title="+5k Diamantes"
            variant="secondary"
            style={styles.btn}
            onPress={handleDiamondsAdd}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 235, 59, 0.08)',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FFD54F',
    marginBottom: spacing.lg,
  },
  title: {
    ...textPresets.bodyMedium,
    color: '#FFD54F',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
  },
});
