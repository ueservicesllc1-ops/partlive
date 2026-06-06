import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { MicRequest } from '../../types';
import { colors, spacing, textPresets } from '../../theme';
import { Avatar } from '../Avatar';

interface MicRequestsPanelProps {
  isVisible: boolean;
  requests: MicRequest[];
  occupiedSeats: number[]; // Array of occupied seat indexes
  onClose: () => void;
  onApprove: (requestId: string, seatIndex: number) => void;
  onReject: (requestId: string) => void;
}

export const MicRequestsPanel: React.FC<MicRequestsPanelProps> = ({
  isVisible,
  requests,
  occupiedSeats,
  onClose,
  onApprove,
  onReject,
}) => {
  // Find first vacant seat by default
  const defaultSeat = [0, 1, 2, 3, 4, 5, 6, 7].find(s => !occupiedSeats.includes(s)) ?? 0;
  const [selectedSeat, setSelectedSeat] = useState<number>(defaultSeat);

  const isAllSeatsOccupied = occupiedSeats.length >= 8;

  const handleApprove = (requestId: string) => {
    if (isAllSeatsOccupied) {
      Alert.alert('Error', 'No hay micrófonos libres.');
      return;
    }
    onApprove(requestId, selectedSeat);
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Solicitudes de Micrófono ({requests.length})</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Seat Index Selector */}
          <View style={styles.seatSelector}>
            <Text style={styles.selectorLabel}>Asignar asiento por defecto:</Text>
            <View style={styles.seatRow}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map(seat => {
                const isOccupied = occupiedSeats.includes(seat);
                return (
                  <TouchableOpacity
                    key={seat}
                    disabled={isOccupied}
                    style={[
                      styles.seatSelectorItem,
                      selectedSeat === seat && styles.seatSelectorItemActive,
                      isOccupied && styles.seatSelectorItemOccupied,
                    ]}
                    onPress={() => setSelectedSeat(seat)}
                  >
                    <Text
                      style={[
                        styles.seatSelectorText,
                        selectedSeat === seat && styles.seatSelectorTextActive,
                        isOccupied && styles.seatSelectorTextOccupied,
                      ]}
                    >
                      {isOccupied ? '❌' : seat + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {isAllSeatsOccupied && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>⚠️ Todos los asientos están ocupados.</Text>
            </View>
          )}

          {requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.requestItem}>
                  <Avatar source={item.photoURL} emoji="👤" size={44} />
                  <View style={styles.requestDetails}>
                    <Text style={styles.displayName}>{item.displayName}</Text>
                    {item.username && <Text style={styles.username}>@{item.username}</Text>}
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => onReject(item.id)}
                    >
                      <Text style={styles.rejectText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approveBtn, isAllSeatsOccupied && styles.disabledBtn]}
                      onPress={() => handleApprove(item.id)}
                      disabled={isAllSeatsOccupied}
                    >
                      <Text style={styles.approveText}>Aceptar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#151221',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 400,
    maxHeight: '80%',
    padding: spacing.xl,
    borderTopWidth: 1.5,
    borderTopColor: '#292440',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...textPresets.h3,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  seatSelector: {
    marginBottom: spacing.md,
    backgroundColor: '#1E1B30',
    padding: spacing.md,
    borderRadius: 16,
  },
  selectorLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seatSelectorItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#292440',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151221',
  },
  seatSelectorItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  seatSelectorItemOccupied: {
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
    borderColor: 'rgba(255, 23, 68, 0.2)',
  },
  seatSelectorText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  seatSelectorTextActive: {
    color: '#FFF',
  },
  seatSelectorTextOccupied: {
    color: '#FF1744',
  },
  warningBanner: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 11,
    color: '#FF1744',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B30',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  requestDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  displayName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  username: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectBtn: {
    backgroundColor: 'rgba(255, 23, 68, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 12,
  },
  rejectText: {
    color: '#FF1744',
    fontSize: 11,
    fontWeight: 'bold',
  },
  approveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 12,
  },
  disabledBtn: {
    backgroundColor: 'rgba(41, 36, 64, 0.6)',
  },
  approveText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
