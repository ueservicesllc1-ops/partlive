import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { usePayouts } from '../../hooks/usePayouts';
import { PayoutMethodForm } from '../../components/payouts';

export const AddPayoutMethodScreen = ({ navigation }: any) => {
  const { createMethod, loading } = usePayouts();

  const handleFormSubmit = async (data: any) => {
    try {
      await createMethod(data);
      Alert.alert('Éxito', 'El método de pago ha sido guardado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo guardar el método de pago.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Método</Text>
        <View style={styles.headerRight} />
      </View>

      <PayoutMethodForm onSubmit={handleFormSubmit} loading={loading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  backArrow: { fontSize: 24, color: colors.text },
  headerTitle: { ...textPresets.h2, color: colors.text, flex: 1, textAlign: 'center' },
  headerRight: { width: 40 },
});
