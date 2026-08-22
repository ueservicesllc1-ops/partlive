import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';

export const SafetyCenterScreen = ({ navigation }: any) => {
  const [dob, setDob] = useState('');
  const [ageStatus, setAgeStatus] = useState<string>('UNKNOWN');
  const [loading, setLoading] = useState(false);

  const handleDeclareAge = async () => {
    if (!dob.trim()) {
      Alert.alert('Atención', 'Ingresa tu fecha de nacimiento en formato AAAA-MM-DD');
      return;
    }

    setLoading(true);
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/trust-safety/age/declare', {
        method: 'POST',
        body: JSON.stringify({ dateOfBirth: dob }),
      });
      setAgeStatus(res.profile.ageStatus);
      Alert.alert('Éxito', `Edad declarada correctamente. Estado: ${res.profile.ageStatus}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo registrar la edad.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/trust-safety/privacy/export');
      Alert.alert('Copia de Datos Generada', `Tu paquete de datos se generó exitosamente con ${res.data?.posts?.length || 0} publicaciones.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo exportar los datos.');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que deseas programar la eliminación de tu cuenta? Tendrás un periodo de gracia de 14 días.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { apiFetch } = await import('../../services/api/apiClient');
              const res = await apiFetch<any>('/trust-safety/privacy/delete', { method: 'POST' });
              Alert.alert('Programado', `Tu cuenta será eliminada el: ${res.scheduledFor}`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo procesar la solicitud.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🛡️ Centro de Seguridad"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Verification & Age Gate */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎂 Verificación de Edad</Text>
          <Text style={styles.cardSub}>
            Estado actual: <Text style={styles.statusVal}>{ageStatus}</Text>
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Fecha de Nacimiento (AAAA-MM-DD)"
            placeholderTextColor={colors.textMuted}
            value={dob}
            onChangeText={setDob}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleDeclareAge} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.btnText}>Declarar Edad</Text>}
          </TouchableOpacity>
        </View>

        {/* Privacy & Download Data */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔒 Privacidad y Datos Personales</Text>
          <Text style={styles.cardSub}>
            Puedes solicitar una copia de tus datos personales o programar la eliminación de tu cuenta.
          </Text>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleExportData}>
            <Text style={styles.secondaryBtnText}>📥 Descargar mis Datos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAccount}>
            <Text style={styles.dangerBtnText}>🗑️ Eliminar mi Cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cardSub: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  statusVal: {
    color: '#00E5FF',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1E1B30',
    color: '#FFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  secondaryBtn: {
    backgroundColor: '#26203D',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  dangerBtn: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#FF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#FF4444',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
