import React from 'react';
import { StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { colors } from '../../theme';

interface FloatingCreateButtonProps {
  onCreateRoom: () => void;
}

export const FloatingCreateButton = ({ onCreateRoom }: FloatingCreateButtonProps) => {
  
  const handlePress = () => {
    Alert.alert(
      "Crear Nuevo",
      "¿Qué te gustaría hacer hoy?",
      [
        { text: "Crear Sala de Voz", onPress: onCreateRoom },
        { text: "Iniciar Live Stream", onPress: () => Alert.alert("Próximamente", "La transmisión de video se implementará en el futuro.") },
        { text: "Crear Evento", onPress: () => Alert.alert("Próximamente", "La creación de eventos estará disponible pronto.") },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={handlePress}>
      <Text style={styles.fabIcon}>+</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    lineHeight: 34,
  },
});
