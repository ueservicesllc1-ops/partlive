import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, Alert } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { CreateRoomForm } from '../../components/rooms/CreateRoomForm';
import { createRoom } from '../../services/firebase/firestore/roomsService';
import { useAuth } from '../../store/AuthContext';
import { MAIN_ROUTES } from '../../app/routes';

export const CreateRoomScreen = ({ navigation }: any) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    if (!userProfile) {
      Alert.alert('Error', 'Debes iniciar sesión para crear una sala');
      return;
    }

    setLoading(true);
    try {
      const ownerProfile = {
        uid: userProfile.uid,
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL,
        username: userProfile.username,
      };

      const roomId = await createRoom(ownerProfile, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        language: formData.language,
        country: formData.country,
        maxSpeakers: formData.maxSpeakers,
        maxUsers: formData.maxUsers,
        isPrivate: formData.isPrivate,
        password: formData.password,
        tags: formData.tags,
        hostIds: [ownerProfile.uid],
        moderatorIds: [],
      });

      navigation.replace(MAIN_ROUTES.ROOM_DETAILS, { roomId });
    } catch (error: any) {
      console.error('Error creating room:', error);
      Alert.alert('Error', error.message || 'No se pudo crear la sala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Sala de Voz</Text>
        <View style={styles.placeholder} />
      </View>

      <CreateRoomForm onSubmit={handleSubmit} loading={loading} />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#292440',
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    ...textPresets.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
});
