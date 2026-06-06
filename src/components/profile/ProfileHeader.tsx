import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { Button } from '../Button';

interface ProfileHeaderProps {
  photoURL?: string;
  displayName: string;
  username: string;
  bio?: string;
  level: number;
  isVerified: boolean;
  role: string;
  onEditPress?: () => void;
}

export const ProfileHeader = ({ photoURL, displayName, username, bio, level, isVerified, role, onEditPress }: ProfileHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv.{level}</Text>
        </View>
      </View>

      <View style={styles.nameContainer}>
        <Text style={styles.displayName}>{displayName}</Text>
        {isVerified && <Text style={styles.verifiedIcon}>✓</Text>}
        {role === 'admin' && <Text style={styles.adminBadge}>ADMIN</Text>}
      </View>
      
      <Text style={styles.username}>@{username}</Text>
      
      {bio ? (
        <Text style={styles.bio}>{bio}</Text>
      ) : null}

      {onEditPress && (
        <Button 
          title="Editar Perfil" 
          variant="secondary" 
          size="medium" 
          onPress={onEditPress} 
          style={styles.editButton} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarInitials: {
    ...textPresets.h1,
    color: colors.primary,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.background,
  },
  levelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  displayName: {
    ...textPresets.h2,
    color: colors.text,
  },
  verifiedIcon: {
    color: '#1DA1F2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminBadge: {
    backgroundColor: colors.error,
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  username: {
    ...textPresets.bodyMedium,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  bio: {
    ...textPresets.bodyMedium,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  editButton: {
    minWidth: 140,
    height: 36,
  },
});
