import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing } from '../../theme';
import firestore from '@react-native-firebase/firestore';
import { Avatar } from '../../components/Avatar';
import { useAuth } from '../../store/AuthContext';

export const ClubDetailsScreen = ({ route, navigation }: any) => {
  const { clubId } = route.params || {};
  const { userProfile } = useAuth();

  const [club, setClub] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) return;

    // Listen to Club doc
    const unsubClub = firestore()
      .collection('clubs')
      .doc(clubId)
      .onSnapshot((doc) => {
        if (doc.exists()) {
          setClub({ id: doc.id, ...doc.data() });
        }
      });

    // Listen to Members
    const unsubMembers = firestore()
      .collection('clubs')
      .doc(clubId)
      .collection('members')
      .onSnapshot((snap) => {
        if (!snap) return;
        const list = snap.docs.map((doc) => doc.data());
        setMembers(list);
        if (userProfile) {
          setIsMember(list.some((m) => m.userId === userProfile.uid));
        }
        setLoading(false);
      });

    return () => {
      unsubClub();
      unsubMembers();
    };
  }, [clubId, userProfile]);

  const handleJoin = async () => {
    if (!userProfile) return;
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      await apiFetch('/clubs/join', {
        method: 'POST',
        body: JSON.stringify({ clubId }),
      });
      Alert.alert('¡Bienvenido!', `Te has unido exitosamente a ${club?.name}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo unir al club.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{club?.name || 'Detalles del Club'}</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <View style={styles.content}>
          {/* Card Info */}
          <View style={styles.infoCard}>
            <Text style={styles.clubTitle}>{club?.name}</Text>
            <Text style={styles.clubDesc}>{club?.description}</Text>
            <Text style={styles.memberBadge}>👥 {members.length} Miembros Activos</Text>

            {!isMember && (
              <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
                <Text style={styles.joinText}>+ Unirme a este Club</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Members & Leaderboard */}
          <Text style={styles.sectionTitle}>🏆 Ranking de Miembros del Club</Text>

          <FlatList
            data={members}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <View style={styles.memberRow}>
                  <Text style={styles.rankMedal}>{medals[index] || `#${index + 1}`}</Text>
                  <Avatar emoji="👤" size={36} />
                  <View style={styles.memberCol}>
                    <Text style={styles.memberName}>Usuario #{item.userId.slice(-4)}</Text>
                    <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#26203D',
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  infoCard: {
    backgroundColor: '#1E1B30',
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    marginBottom: spacing.lg,
  },
  clubTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  clubDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
  },
  memberBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
  },
  joinBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  joinText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: spacing.md,
  },
  listContent: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141124',
    padding: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  rankMedal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    width: 32,
    textAlign: 'center',
  },
  memberCol: {
    marginLeft: 10,
    flex: 1,
  },
  memberName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  roleText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
});
