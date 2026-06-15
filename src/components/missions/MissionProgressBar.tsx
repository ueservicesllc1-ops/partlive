import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface Props {
  progress: number;
  target: number;
}

export const MissionProgressBar: React.FC<Props> = ({ progress, target }) => {
  const percent = Math.min((progress / (target || 1)) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.label}>
        {progress}/{target}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    width: '100%',
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: '#292440',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textMuted,
    minWidth: 35,
    textAlign: 'right',
  },
});
