import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { Button } from '../../components/Button';

export const GameDetailsScreen = ({ route, navigation }: any) => {
  const { gameId } = route.params || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Juego</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.gameBanner}>
          <Text style={styles.gameEmoji}>🎲</Text>
        </View>
        
        <View style={styles.infoBox}>
          <Text style={styles.gameName}>Ludo Mágico</Text>
          <Text style={styles.gameDesc}>Juega ludo con voz en tiempo real. Reta a tus amigos o encuentra nuevos oponentes.</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>👥 2-4 Jugadores</Text>
            <Text style={styles.statText}>⏱️ ~10 min</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ranking Semanal</Text>
        <View style={styles.rankingBox}>
          <View style={styles.rankItem}>
            <Text style={styles.rankPos}>1</Text>
            <Text style={styles.rankName}>EstrellaNinja</Text>
            <Text style={styles.rankScore}>1500 pts</Text>
          </View>
          <View style={styles.rankItem}>
            <Text style={styles.rankPos}>2</Text>
            <Text style={styles.rankName}>LudoKing</Text>
            <Text style={styles.rankScore}>1200 pts</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button title="Invitar Amigo" variant="outline" style={styles.inviteButton} onPress={() => {}} />
        <Button title="Jugar Ahora" variant="primary" style={styles.playButton} onPress={() => {}} disabled />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backButton: { padding: spacing.xs },
  backIcon: { fontSize: 24, color: colors.text },
  headerTitle: { ...textPresets.h3, color: colors.text },
  scrollContent: { padding: spacing.xl, paddingBottom: 100 },
  gameBanner: { height: 150, backgroundColor: '#4A148C', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  gameEmoji: { fontSize: 60 },
  infoBox: { marginBottom: spacing.xl },
  gameName: { ...textPresets.h2, color: colors.text, marginBottom: spacing.xs },
  gameDesc: { ...textPresets.bodyMedium, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.lg },
  statText: { ...textPresets.caption, color: colors.primary, fontWeight: 'bold' },
  sectionTitle: { ...textPresets.h3, color: colors.text, marginBottom: spacing.md },
  rankingBox: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  rankItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  rankPos: { ...textPresets.h3, color: colors.textMuted, width: 30 },
  rankName: { ...textPresets.bodyMedium, color: colors.text, flex: 1 },
  rankScore: { ...textPresets.caption, color: colors.secondary },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: spacing.md },
  inviteButton: { flex: 1 },
  playButton: { flex: 2 },
});
