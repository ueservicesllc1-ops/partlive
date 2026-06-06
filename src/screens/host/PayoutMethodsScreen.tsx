import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { usePayouts } from '../../hooks/usePayouts';
import { PayoutMethodCard } from '../../components/payouts';

export const PayoutMethodsScreen = ({ navigation }: any) => {
  const { payoutMethods, deleteMethod, loading } = usePayouts();

  const handleDelete = (id: string, label: string) => {
    Alert.alert(
      'Eliminar Método de Pago',
      `¿Estás seguro que deseas eliminar "${label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMethod(id);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'No se pudo eliminar el método.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Métodos de Pago</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Configura tus cuentas para recibir transferencias cuando solicites un retiro de diamantes.
        </Text>

        {payoutMethods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏦</Text>
            <Text style={styles.emptyTitle}>No tienes métodos guardados</Text>
            <Text style={styles.emptySubtitle}>
              Agrega una cuenta PayPal o cuenta bancaria para poder retirar tus ganancias.
            </Text>
          </View>
        ) : (
          payoutMethods.map((method) => (
            <PayoutMethodCard
              key={method.id}
              method={method}
              onDelete={() => handleDelete(method.id, method.label)}
            />
          ))
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddPayoutMethod')}
        >
          <Text style={styles.addButtonText}>+ Agregar Método de Pago</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: { fontSize: 36, marginBottom: spacing.sm },
  emptyTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
  addButton: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
