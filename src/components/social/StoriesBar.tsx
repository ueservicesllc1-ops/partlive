import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, spacing } from '../../theme';

interface StoryItem {
  id: string;
  authorId: string;
  mediaUrl: string;
  authorName?: string;
  avatarUrl?: string;
}

interface StoriesBarProps {
  stories: StoryItem[];
  onSelectStory: (story: StoryItem) => void;
  onCreateStory?: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  onSelectStory,
  onCreateStory,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Create Story Button */}
        <TouchableOpacity style={styles.createBox} onPress={onCreateStory}>
          <View style={styles.addCircle}>
            <Text style={styles.addText}>+</Text>
          </View>
          <Text style={styles.nameText}>Tu Historia</Text>
        </TouchableOpacity>

        {/* Stories List */}
        {stories.map((story) => (
          <TouchableOpacity key={story.id} style={styles.storyBox} onPress={() => onSelectStory(story)}>
            <View style={styles.ring}>
              <Image
                source={{ uri: story.avatarUrl || 'https://via.placeholder.com/100' }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.nameText} numberOfLines={1}>
              {story.authorName || 'Host'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    backgroundColor: '#141124',
    borderBottomWidth: 1,
    borderColor: '#26203D',
  },
  scroll: {
    paddingHorizontal: spacing.md,
    gap: 12,
  },
  createBox: {
    alignItems: 'center',
    gap: 4,
  },
  addCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#26203D',
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: 'bold',
  },
  storyBox: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  ring: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    backgroundColor: '#342D54',
  },
  nameText: {
    fontSize: 10,
    color: '#FFF',
    textAlign: 'center',
  },
});
