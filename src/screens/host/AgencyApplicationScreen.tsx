import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { useAgencyApplication } from '../../hooks/useAgencyApplication';
import { Button } from '../../components/Button';

export const AgencyApplicationScreen = ({ navigation }: any) => {
  const { apply, loading, error, success, setError } = useAgencyApplication();
  
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (!name || !country || !email) {
      setError('Por favor, completa todos los campos marcados con (*).');
      return;
    }
    await apply({ name, country, email, phone });
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successWrapper}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Solicitud Enviada</Text>
          <Text style={styles.successText}>
            Tu solicitud para registrar la agencia "{name}" ha sido recibida correctamente. Nuestro equipo administrativo la revisará en un plazo de 24 a 48 horas.
          </Text>
          <Button
            title="Volver al Host Center"
            variant="primary"
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitud de Agencia</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.instruction}>
          Crea tu propia agencia en PartyLiveApp para reclutar hosts, coordinar transmisiones y ganar comisiones basadas en la actividad y Beans generados.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.form}>
          <Text style={styles.label}>Nombre de la Agencia *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej. Galaxy Agency"
            placeholderTextColor={colors.textDark}
          />

          <Text style={styles.label}>País *</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="Ej. Chile"
            placeholderTextColor={colors.textDark}
          />

          <Text style={styles.label}>Correo Electrónico de Contacto *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="correo@agencia.com"
            placeholderTextColor={colors.textDark}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Teléfono de Contacto (Opcional)</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+56 9 1234 5678"
            placeholderTextColor={colors.textDark}
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.submitBtnText}>Enviar Solicitud</Text>
            )}
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  instruction: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  successWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: 'bold',
  },
  successText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
});
export default AgencyApplicationScreen;
