import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { useAuth } from '../../store/AuthContext';
import { Button } from '../../components/Button';

export const SettingsScreen = ({ navigation }: any) => {
  const { logout } = useAuth();

  const OptionItem = ({ title, onPress }: { title: string, onPress: () => void }) => (
    <TouchableOpacity style={styles.optionItem} onPress={onPress}>
      <Text style={styles.optionText}>{title}</Text>
      <Text style={styles.optionArrow}>❯</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <OptionItem title="Privacidad" onPress={() => {}} />
        <OptionItem title="Notificaciones" onPress={() => {}} />
        <OptionItem title="Seguridad" onPress={() => {}} />

        <Text style={styles.sectionTitle}>General</Text>
        <OptionItem title="Idioma" onPress={() => {}} />
        <OptionItem title="Ayuda y Soporte" onPress={() => {}} />
        <OptionItem title="Acerca de PartyLive" onPress={() => {}} />

        <Button 
          title="Cerrar Sesión" 
          variant="outline" 
          style={styles.logoutButton} 
          onPress={logout} 
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: spacing.xs },
  backIcon: { fontSize: 24, color: colors.text },
  headerTitle: { ...textPresets.h3, color: colors.text },
  scrollContent: { padding: spacing.xl },
  sectionTitle: { ...textPresets.bodySmall, color: colors.textMuted, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: spacing.md, marginTop: spacing.lg },
  optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  optionText: { ...textPresets.bodyMedium, color: colors.text },
  optionArrow: { color: colors.textMuted, fontSize: 16 },
  logoutButton: { marginTop: spacing.xxl },
});
