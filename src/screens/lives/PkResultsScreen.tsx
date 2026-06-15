import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { colors, spacing } from '../../theme';
import { PkResultCard } from '../../components/pk/PkResultCard';
import { useAuth } from '../../store/AuthContext';

export const PkResultsScreen = ({ route, navigation }: any) => {
  const { battle } = route.params || {};
  const { userProfile } = useAuth();

  if (!battle) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Detalles de la batalla PK no disponibles.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
          <Text style={styles.buttonText}>Cerrar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resultados PK</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <PkResultCard battle={battle} currentUserId={userProfile?.uid} />

        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>Detalles de Rendimiento</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Total de Regalos Recibidos (Host A)</Text>
            <Text style={styles.val}>{battle.hostAGiftsCount || 0}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Total de Regalos Recibidos (Host B)</Text>
            <Text style={styles.val}>{battle.hostBGiftsCount || 0}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Diamantes Generados (Host A)</Text>
            <Text style={styles.val}>{battle.hostADiamonds || 0} 💎</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Diamantes Generados (Host B)</Text>
            <Text style={styles.val}>{battle.hostBDiamonds || 0} 💎</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
          <Text style={styles.buttonText}>Aceptar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  scrollContent: {
    padding: spacing.md,
  },
  detailsBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
  },
  val: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
export default PkResultsScreen;
