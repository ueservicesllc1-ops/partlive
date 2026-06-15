import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { useKaraokeBattle } from '../../hooks/useKaraokeBattle';
import { useAuth } from '../../store/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../app/navigationTypes';

type Props = NativeStackScreenProps<MainStackParamList, 'KaraokeBattle'>;

export const KaraokeBattleScreen: React.FC<Props> = ({ route, navigation }) => {
  const { targetType, targetId } = route.params;
  const { user } = useAuth();

  const {
    battle,
    votes,
    loading,
    isParticipant,
    totalVotesCount,
    startBattle,
    joinBattle,
    voteForParticipant,
    endBattle,
  } = useKaraokeBattle(targetType, targetId);

  // Form states to schedule/start a new battle
  const [battleTitle, setBattleTitle] = useState('Duelo de Divas 🎤');
  const [participantText, setParticipantText] = useState('');

  const handleCreateBattle = async () => {
    // Split comma separated IDs or names
    const mockIds = [user?.uid || 'user_1', 'system_host_2'];
    await startBattle(battleTitle, mockIds, '¡Vota por tu favorito en tiempo real!');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.text }}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Batalla de Karaoke 🏆</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!battle ? (
          <View style={styles.setupCard}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>🏆</Text>
            <Text style={styles.setupTitle}>Crear Batalla de Karaoke</Text>
            <Text style={styles.setupDesc}>
              Lanza un duelo de canto en vivo. Los espectadores podrán votar por su favorito en tiempo real.
            </Text>

            <TouchableOpacity style={styles.createBtn} onPress={handleCreateBattle}>
              <Text style={styles.createBtnText}>Iniciar Duelo Rápido</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.battleContainer}>
            <View style={styles.titleCard}>
              <Text style={styles.battleTitle}>{battle.title}</Text>
              <Text style={styles.battleDesc}>{battle.description}</Text>
              <View style={styles.votesSummary}>
                <Text style={{ fontSize: 14 }}>👥</Text>
                <Text style={styles.votesCount}>{totalVotesCount} Votos Emitidos</Text>
              </View>
            </View>

            {/* Participants display */}
            <View style={styles.participantsGrid}>
              {battle.participantIds.map((pId) => {
                const pVotes = votes[pId] || 0;
                const percentage = totalVotesCount > 0 ? Math.round((pVotes / totalVotesCount) * 100) : 0;
                const isMe = pId === user?.uid;

                return (
                  <View key={pId} style={[styles.participantCard, isMe && styles.myParticipantCard]}>
                    <View style={styles.singerAvatarBg}>
                      <Text style={{ fontSize: 32 }}>👤</Text>
                    </View>
                    <Text style={styles.singerName} numberOfLines={1}>
                      {isMe ? 'Tú' : `Cantante ${pId.substring(0, 5)}`}
                    </Text>

                    {/* Progress vote bar */}
                    <View style={styles.voteBarBg}>
                      <View style={[styles.voteBarFill, { width: `${percentage}%` }]} />
                    </View>

                    <Text style={styles.voteLabel}>
                      {pVotes} votos ({percentage}%)
                    </Text>

                    {battle.votingEnabled && !isParticipant && (
                      <TouchableOpacity style={styles.voteBtn} onPress={() => voteForParticipant(pId)}>
                        <Text style={styles.voteBtnText}>Votar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Host Controls */}
            {battle.status === 'active' && (
              <View style={styles.hostControlRow}>
                <TouchableOpacity style={styles.endBattleBtn} onPress={endBattle}>
                  <Text style={styles.endBattleText}>Finalizar Batalla y Declarar Ganador</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  setupCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    marginTop: 40,
  },
  setupIcon: {
    marginBottom: 16,
  },
  setupTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  setupDesc: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  battleContainer: {
    gap: 16,
  },
  titleCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  battleTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  battleDesc: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  votesSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  votesCount: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  participantsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  participantCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
  },
  myParticipantCard: {
    borderColor: colors.primary,
  },
  singerAvatarBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  singerName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  voteBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  voteBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  voteLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 16,
  },
  voteBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  voteBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  hostControlRow: {
    marginTop: 20,
  },
  endBattleBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  endBattleText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
