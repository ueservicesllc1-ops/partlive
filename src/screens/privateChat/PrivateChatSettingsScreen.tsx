import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../store/AuthContext';
import { getUserProfile, updateUserProfile } from '../../services/firebase/firestore/usersService';
import { getNotificationSettings, updateNotificationSettings } from '../../services/api/notificationsApi';

export const PrivateChatSettingsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allowMessagesFrom, setAllowMessagesFrom] = useState<'everyone' | 'followers' | 'friends' | 'none'>('everyone');
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [privateMessagesNotify, setPrivateMessagesNotify] = useState(true);

  const userId = user?.uid;

  useEffect(() => {
    if (!userId) return;

    const loadSettings = async () => {
      try {
        const profile = await getUserProfile(userId);
        if (profile) {
          setAllowMessagesFrom(profile.allowMessagesFrom || 'everyone');
          setShowOnlineStatus(profile.showOnlineStatus !== false);
        }

        const notifSettings = await getNotificationSettings();
        if (notifSettings) {
          setPrivateMessagesNotify(notifSettings.privateMessages !== false);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [userId]);

  const handleSave = async (
    field: 'allowMessagesFrom' | 'showOnlineStatus' | 'privateMessagesNotify',
    value: any
  ) => {
    if (!userId) return;
    setSaving(true);
    try {
      if (field === 'allowMessagesFrom') {
        setAllowMessagesFrom(value);
        await updateUserProfile(userId, { allowMessagesFrom: value });
      } else if (field === 'showOnlineStatus') {
        setShowOnlineStatus(value);
        await updateUserProfile(userId, { showOnlineStatus: value });
      } else if (field === 'privateMessagesNotify') {
        setPrivateMessagesNotify(value);
        await updateNotificationSettings({ privateMessages: value });
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ajustes de Chat</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>¿Quién puede enviarte mensajes?</Text>
        
        <TouchableOpacity
          style={[styles.optionRow, allowMessagesFrom === 'everyone' && styles.optionSelected]}
          onPress={() => handleSave('allowMessagesFrom', 'everyone')}
        >
          <Text style={styles.optionText}>Todos</Text>
          {allowMessagesFrom === 'everyone' && <Text style={styles.checkIcon}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionRow, allowMessagesFrom === 'followers' && styles.optionSelected]}
          onPress={() => handleSave('allowMessagesFrom', 'followers')}
        >
          <Text style={styles.optionText}>Seguidores / Personas que sigo</Text>
          {allowMessagesFrom === 'followers' && <Text style={styles.checkIcon}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionRow, allowMessagesFrom === 'friends' && styles.optionSelected]}
          onPress={() => handleSave('allowMessagesFrom', 'friends')}
        >
          <Text style={styles.optionText}>Amigos (Seguidores mutuos)</Text>
          {allowMessagesFrom === 'friends' && <Text style={styles.checkIcon}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionRow, allowMessagesFrom === 'none' && styles.optionSelected]}
          onPress={() => handleSave('allowMessagesFrom', 'none')}
        >
          <Text style={styles.optionText}>Nadie</Text>
          {allowMessagesFrom === 'none' && <Text style={styles.checkIcon}>✓</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacidad y estado</Text>
        
        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>Mostrar estado online</Text>
            <Text style={styles.switchSubtitle}>Permite que otros vean si estás en línea.</Text>
          </View>
          <Switch
            value={showOnlineStatus}
            onValueChange={val => handleSave('showOnlineStatus', val)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>Notificaciones push</Text>
            <Text style={styles.switchSubtitle}>Recibir avisos cuando lleguen nuevos mensajes.</Text>
          </View>
          <Switch
            value={privateMessagesNotify}
            onValueChange={val => handleSave('privateMessagesNotify', val)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.savingText}>Guardando cambios...</Text>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  backText: {
    fontSize: 24,
    color: colors.text,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: 14,
  },
  checkIcon: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  switchSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  savingOverlay: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: colors.surfaceLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    gap: spacing.sm,
    elevation: 3,
  },
  savingText: {
    color: colors.text,
    fontSize: 12,
  },
});
