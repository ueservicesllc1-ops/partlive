import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { useAuth } from '../../store/AuthContext';
import { formatCompactNumber } from '../../utils/formatNumbers';

export const HomeGreeting = () => {
  const { userProfile } = useAuth();

  if (!userProfile) return null;

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.greeting}>Hola, {userProfile.displayName}</Text>
        <Text style={styles.subtitle}>¿Qué quieres hacer hoy?</Text>
      </View>
      <View style={styles.rightSection}>
        {userProfile.photoURL ? (
          <Image source={{ uri: userProfile.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{userProfile.displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv.{userProfile.level}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    ...textPresets.h2,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...textPresets.bodyMedium,
    color: colors.textMuted,
  },
  rightSection: {
    position: 'relative',
    marginLeft: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarInitials: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 20,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.background,
  },
  levelText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
