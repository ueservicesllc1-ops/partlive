import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { colors, spacing, textPresets } from '../../theme';
import { GameSession } from '../../types/game';
import { UserProfile } from '../../types/user';
import { searchUsersByUsername, searchUsersByDisplayName } from '../../services/firebase/firestore/usersService';
import { createGameInvite } from '../../services/firebase/firestore/gameInvitesService';

interface InvitePlayersModalProps {
  visible: boolean;
  onClose: () => void;
  session: GameSession;
}

export const InvitePlayersModal: React.FC<InvitePlayersModalProps> = ({
  visible,
  onClose,
  session,
}) => {
  const currentUser = auth().currentUser;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Track status of invites sent in this modal session: userId -> 'sending' | 'invited' | 'error'
  const [inviteStatus, setInviteStatus] = useState<Record<string, 'sending' | 'invited' | 'error'>>({});

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 1) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (searchText: string) => {
    setSearching(true);
    try {
      const [byUser, byDisplay] = await Promise.all([
        searchUsersByUsername(searchText, 10),
        searchUsersByDisplayName(searchText, 10),
      ]);

      const combined = [...byUser];
      byDisplay.forEach(u => {
        if (!combined.some(c => c.uid === u.uid)) {
          combined.push(u);
        }
      });

      // Filter out current user
      const filtered = combined.filter(u => u.uid !== currentUser?.uid);
      setResults(filtered);
    } catch (err) {
      console.error('Error searching users for invites:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSendInvite = async (user: UserProfile) => {
    if (!currentUser) return;
    
    setInviteStatus(prev => ({ ...prev, [user.uid]: 'sending' }));

    try {
      const fromUserProfile = {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Usuario',
        photoURL: currentUser.photoURL || undefined,
      };

      const toUserProfile = {
        uid: user.uid,
        displayName: user.displayName || user.username || 'Invitado',
        photoURL: user.photoURL || undefined,
      };

      await createGameInvite(session, fromUserProfile, toUserProfile);
      
      setInviteStatus(prev => ({ ...prev, [user.uid]: 'invited' }));
    } catch (err) {
      console.error('Failed to create invite:', err);
      setInviteStatus(prev => ({ ...prev, [user.uid]: 'error' }));
    }
  };

  const renderItem = ({ item }: { item: UserProfile }) => {
    const status = inviteStatus[item.uid];
    const isAlreadyInvited = session.invitedUserIds?.includes(item.uid);

    let btnText = 'Invitar';
    let btnDisabled = false;
    let btnStyle = styles.inviteBtn;

    if (isAlreadyInvited || status === 'invited') {
      btnText = 'Invitado';
      btnDisabled = true;
      btnStyle = styles.invitedBtn;
    } else if (status === 'sending') {
      btnText = 'Enviando...';
      btnDisabled = true;
      btnStyle = styles.invitedBtn;
    } else if (status === 'error') {
      btnText = 'Reintentar';
      btnStyle = styles.errorBtn;
    }

    return (
      <View style={styles.userRow}>
        <View style={styles.userInfo}>
          <Text style={styles.userAvatar}>👤</Text>
          <View>
            <Text style={styles.userDisplayName}>{item.displayName}</Text>
            <Text style={styles.userUsername}>@{item.username || 'user'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btnBase, btnStyle]}
          onPress={() => handleSendInvite(item)}
          disabled={btnDisabled}
        >
          {status === 'sending' ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.btnText}>{btnText}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Invitar Amigos</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchBar}
              placeholder="Buscar por nombre o usuario..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />

            {searching && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Buscando usuarios...</Text>
              </View>
            )}

            {!searching && query.trim().length > 1 && results.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No se encontraron usuarios.</Text>
              </View>
            )}

            <FlatList
              data={results}
              renderItem={renderItem}
              keyExtractor={item => item.uid}
              contentContainerStyle={styles.listContainer}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1E1935',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    height: '75%',
    borderWidth: 1,
    borderColor: '#2D274A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { ...textPresets.h3, color: colors.text },
  closeBtn: { padding: spacing.xs },
  closeIcon: { fontSize: 18, color: colors.textMuted, fontWeight: '700' },
  searchBar: {
    backgroundColor: '#0B0813',
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2D274A',
    marginBottom: spacing.md,
  },
  listContainer: { paddingBottom: spacing.xxl },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#2D274A',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  userAvatar: { fontSize: 28 },
  userDisplayName: { ...textPresets.bodyMedium, color: colors.text, fontWeight: '700' },
  userUsername: { ...textPresets.caption, color: colors.textMuted },
  btnBase: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteBtn: { backgroundColor: colors.primary },
  invitedBtn: { backgroundColor: '#332E4A' },
  errorBtn: { backgroundColor: colors.error },
  btnText: { ...textPresets.caption, color: '#FFF', fontWeight: '700' },
  loadingContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: { ...textPresets.caption, color: colors.textMuted },
  emptyContainer: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { ...textPresets.bodyMedium, color: colors.textMuted },
});
