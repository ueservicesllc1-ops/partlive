import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, SafeAreaView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { getUserProfile, updateUserProfile } from '../../services/firebase/firestore/usersService';
import auth from '@react-native-firebase/auth';

export const PrivacySettingsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [activityVisibility, setActivityVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [showCountry, setShowCountry] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  const currentUserId = auth().currentUser?.uid || '';

  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentUserId) return;
      try {
        const profile = await getUserProfile(currentUserId);
        if (profile) {
          setProfileVisibility(profile.profileVisibility || 'public');
          setActivityVisibility(profile.activityVisibility || 'public');
          setShowCountry(profile.showCountry !== undefined ? profile.showCountry : true);
          setShowOnlineStatus(profile.showOnlineStatus !== undefined ? profile.showOnlineStatus : true);
        }
      } catch (err) {
        console.error('Failed to load privacy settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [currentUserId]);

  const handleSave = async (
    key: 'profileVisibility' | 'activityVisibility' | 'showCountry' | 'showOnlineStatus',
    value: any
  ) => {
    if (!currentUserId) return;
    setSaving(true);
    try {
      await updateUserProfile(currentUserId, { [key]: value });
      // Update local state
      if (key === 'profileVisibility') setProfileVisibility(value);
      if (key === 'activityVisibility') setActivityVisibility(value);
      if (key === 'showCountry') setShowCountry(value);
      if (key === 'showOnlineStatus') setShowOnlineStatus(value);
    } catch (err) {
      console.error('Failed to update privacy settings:', err);
      Alert.alert('Error', 'No se pudo guardar la configuración de privacidad.');
    } finally {
      setSaving(false);
    }
  };

  const renderOptionGroup = (
    title: string,
    currentValue: 'public' | 'followers' | 'private',
    onSelect: (val: 'public' | 'followers' | 'private') => void
  ) => {
    const options: { key: 'public' | 'followers' | 'private'; label: string }[] = [
      { key: 'public', label: 'Público 🌍' },
      { key: 'followers', label: 'Solo seguidores 👥' },
      { key: 'private', label: 'Privado 🔒' },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.segmentContainer}>
          {options.map(opt => {
            const active = currentValue === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => onSelect(opt.key)}
                style={[styles.segmentButton, active && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacidad</Text>
        <View style={styles.placeholder}>
          {saving && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </View>

      <View style={styles.content}>
        {/* Profile Visibility */}
        {renderOptionGroup(
          '¿Quién puede ver tu perfil?',
          profileVisibility,
          val => handleSave('profileVisibility', val)
        )}

        {/* Activity Visibility */}
        {renderOptionGroup(
          '¿Quién puede ver tu actividad reciente?',
          activityVisibility,
          val => handleSave('activityVisibility', val)
        )}

        {/* Show Country Toggle */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Mostrar país 📍</Text>
            <Text style={styles.toggleSub}>Permite a otros ver tu región geográfica.</Text>
          </View>
          <Switch
            value={showCountry}
            onValueChange={val => handleSave('showCountry', val)}
            trackColor={{ false: colors.surfaceLight, true: colors.primary }}
          />
        </View>

        {/* Show Online Status Toggle */}
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Mostrar estado de conexión 🟢</Text>
            <Text style={styles.toggleSub}>Muestra si estás activo en la plataforma.</Text>
          </View>
          <Switch
            value={showOnlineStatus}
            onValueChange={val => handleSave('showOnlineStatus', val)}
            trackColor={{ false: colors.surfaceLight, true: colors.primary }}
          />
        </View>
      </View>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    ...textPresets.header,
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
export default PrivacySettingsScreen;
