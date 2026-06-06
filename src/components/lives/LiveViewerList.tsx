import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { LiveViewer } from '../../types/live';
import { Avatar } from '../Avatar';
import { spacing } from '../../theme';

interface LiveViewerListProps {
  viewers: LiveViewer[];
  onViewerPress?: (viewer: LiveViewer) => void;
}

export const LiveViewerList: React.FC<LiveViewerListProps> = ({ viewers, onViewerPress }) => {
  // Exclude hosts from viewers list
  const listData = viewers.filter(v => v.role !== 'host');

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.userId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onViewerPress && onViewerPress(item)}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            <Avatar 
              source={item.photoURL} 
              emoji={item.role === 'moderator' ? '🛡️' : '👤'} 
              size={32} 
            />
            {item.role === 'moderator' && <View style={styles.modBadge} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 6,
  },
  avatarWrapper: {
    position: 'relative',
  },
  modBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5FF',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#000',
  },
});
