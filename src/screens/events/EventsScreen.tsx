import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';
import { Button } from '../../components/Button';

export const EventsScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader 
        title="Eventos" 
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onWalletPress={() => navigation.navigate('Wallet')}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.eventCard}>
          <View style={styles.eventBanner}>
            <Text style={styles.bannerEmoji}>🎉</Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>Fiesta de Fin de Mes</Text>
            <Text style={styles.eventDate}>28 al 31 de Junio</Text>
            <Text style={styles.eventDesc}>Únete a las salas de fiesta y gana regalos dobles por interactuar con los hosts participantes.</Text>
            <Button title="Participar" variant="primary" onPress={() => {}} style={styles.button} />
          </View>
        </View>

        <View style={styles.eventCard}>
          <View style={[styles.eventBanner, { backgroundColor: '#FF8A65' }]}>
            <Text style={styles.bannerEmoji}>🏆</Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>Torneo de Ludo</Text>
            <Text style={styles.eventDate}>Próximo Viernes</Text>
            <Text style={styles.eventDesc}>Juega ludo con tus amigos y sube en el ranking para ganar 10,000 monedas.</Text>
            <Button title="Participar" variant="primary" onPress={() => {}} style={styles.button} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.xl },
  eventCard: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.border },
  eventBanner: { height: 120, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  bannerEmoji: { fontSize: 48 },
  eventInfo: { padding: spacing.lg },
  eventTitle: { ...textPresets.h2, color: colors.text, marginBottom: spacing.xs },
  eventDate: { ...textPresets.bodySmall, color: colors.textMuted, fontWeight: 'bold', marginBottom: spacing.md },
  eventDesc: { ...textPresets.bodyMedium, color: colors.text, marginBottom: spacing.lg, lineHeight: 22 },
  button: { width: '100%' },
});
