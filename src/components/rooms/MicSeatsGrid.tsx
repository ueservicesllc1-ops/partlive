import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RoomMember } from '../../types';
import { MicSeatCard } from './MicSeatCard';

interface MicSeatsGridProps {
  members: RoomMember[];
  onSeatPress: (index: number, occupant?: RoomMember) => void;
}

export const MicSeatsGrid: React.FC<MicSeatsGridProps> = ({ members, onSeatPress }) => {
  // Create 8 microphone seats
  const seats = Array.from({ length: 8 }, (_, index) => {
    const occupant = members.find(m => m.seatIndex === index);
    return { index, occupant };
  });

  return (
    <View style={styles.grid}>
      {seats.map(seat => (
        <MicSeatCard
          key={seat.index}
          index={seat.index}
          member={seat.occupant}
          onPress={() => onSeatPress(seat.index, seat.occupant)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginVertical: 12,
  },
});
