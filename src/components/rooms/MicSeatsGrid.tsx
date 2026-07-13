import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RoomMember } from '../../types';
import { MicSeatCard } from './MicSeatCard';

interface MicSeatsGridProps {
  members: RoomMember[];
  lockedSeats?: number[];
  onSeatPress: (index: number, occupant?: RoomMember) => void;
  maxMics?: number;
}

export const MicSeatsGrid: React.FC<MicSeatsGridProps> = ({ members, lockedSeats = [], onSeatPress, maxMics = 8 }) => {
  // Create dynamic microphone seats based on room config
  const seats = Array.from({ length: maxMics }, (_, index) => {
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
          locked={lockedSeats.includes(seat.index)}
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
