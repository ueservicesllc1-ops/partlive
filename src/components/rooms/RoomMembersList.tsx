import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { RoomMember } from '../../types';
import { colors, spacing, textPresets } from '../../theme';
import { Avatar } from '../Avatar';
import { RoomRoleBadge } from './RoomRoleBadge';

interface RoomMembersListProps {
  members: RoomMember[];
  onMemberPress: (member: RoomMember) => void;
}

export const RoomMembersList: React.FC<RoomMembersListProps> = ({ members, onMemberPress }) => {
  // Hide members who are kicked from the list, and sort by role elevated importance
  const activeMembers = members.filter(m => !m.isKicked);
  
  // Group or classify listeners vs others
  const listeners = activeMembers.filter(m => m.seatIndex === undefined && m.role === 'listener');
  const privileged = activeMembers.filter(m => m.role !== 'listener' || m.seatIndex !== undefined);

  return (
    <View style={styles.container}>
      {/* 1. Admins & Speakers Section */}
      {privileged.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>En el Escenario / Admin</Text>
          <FlatList
            data={privileged}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.memberItem}
                onPress={() => onMemberPress(item)}
                activeOpacity={0.8}
              >
                <Avatar source={item.photoURL} emoji="👤" size={38} />
                <View style={styles.badgeWrapper}>
                  <RoomRoleBadge role={item.role} />
                </View>
                <Text style={styles.displayName} numberOfLines={1}>
                  {item.displayName.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* 2. Listeners Section */}
      <View style={[styles.section, { marginTop: privileged.length > 0 ? spacing.md : 0 }]}>
        <Text style={styles.sectionTitle}>Oyentes ({listeners.length})</Text>
        {listeners.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay oyentes en este momento</Text>
          </View>
        ) : (
          <FlatList
            data={listeners}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.memberItem}
                onPress={() => onMemberPress(item)}
                activeOpacity={0.8}
              >
                <Avatar source={item.photoURL} emoji="👤" size={36} />
                <Text style={styles.displayName} numberOfLines={1}>
                  {item.displayName.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    backgroundColor: 'rgba(28, 25, 46, 0.6)',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#292440',
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    ...textPresets.bodySmall,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  memberItem: {
    alignItems: 'center',
    width: 60,
    position: 'relative',
  },
  badgeWrapper: {
    marginTop: 2,
    transform: [{ scale: 0.8 }],
  },
  displayName: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
