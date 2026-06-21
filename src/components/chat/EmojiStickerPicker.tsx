import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { colors, spacing } from '../../theme';

interface EmojiStickerPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectSticker: (stickerUrl: string) => void;
  visible: boolean;
}

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
  '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
  '🤗', '🤔', '🫣', '🤭', '🫢', '🤫', '🤥', '😶', '😐', '😑', '😬', '🫨', '🫠', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱',
  '😴', '🤤', '😪', '😵', '😵‍💫', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡',
  '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐️',
  '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊',
  '👊', '🤛', '🤜', '👏', '🙌', '👐', '🫶', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
  '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸', '❤️', '🩷', '🧡', '💛', '💚', '💙', '🩵', '💜', '🖤',
  '🩶', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💥', '✨', '🌟', '⭐', '🎈',
  '🎉', '🎊', '🧧', '🎀', '🎁', '🎂', '🧁', '🍪', '🍬', '🍭', '🍓', '🍒', '🍕', '🍔', '🍟', '🍺', '🍻', '🥂', '🥃', '🥤',
  '🔥', '💧', '⚡', '🌈', '☀️', '⭐', '☁️', '❄️', '🐾', '🐼', '🐨', '🦊', '🐰', '🦁', '🐯', '🐸', '🐵', '🐔', '🦄', '🐝'
];

const STICKERS = [
  { id: 'smile', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.webp', name: 'Smile' },
  { id: 'laugh', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.webp', name: 'Laugh' },
  { id: 'love', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp', name: 'Love' },
  { id: 'wink', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f609/512.webp', name: 'Wink' },
  { id: 'cool', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp', name: 'Cool' },
  { id: 'thinking', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.webp', name: 'Thinking' },
  { id: 'cry', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f622/512.webp', name: 'Cry' },
  { id: 'scream', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f631/512.webp', name: 'Scream' },
  { id: 'clap', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.webp', name: 'Clap' },
  { id: 'ok', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44c/512.webp', name: 'OK' },
  { id: 'thumbsup', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.webp', name: 'Thumbs Up' },
  { id: 'celebrate', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.webp', name: 'Celebrate' },
  { id: 'fire', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp', name: 'Fire' },
  { id: 'heart', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.webp', name: 'Heart' },
  { id: 'brokenheart', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f494/512.webp', name: 'Broken Heart' },
  { id: 'star', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2b50/512.webp', name: 'Star' },
  { id: 'ghost', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f47b/512.webp', name: 'Ghost' },
  { id: 'alien', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f47d/512.webp', name: 'Alien' },
  { id: 'dog', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f436/512.webp', name: 'Dog' },
  { id: 'cat', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f431/512.webp', name: 'Cat' },
  { id: 'panda', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f43c/512.webp', name: 'Panda' },
  { id: 'fox', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f98a/512.webp', name: 'Fox' },
  { id: 'unicorn', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f984/512.webp', name: 'Unicorn' },
  { id: 'alien_monster', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f47e/512.webp', name: 'Invader' },
];

export const EmojiStickerPicker: React.FC<EmojiStickerPickerProps> = ({
  onSelectEmoji,
  onSelectSticker,
  visible,
}) => {
  const [activeTab, setActiveTab] = useState<'emoji' | 'sticker'>('emoji');

  if (!visible) return null;

  return (
    <View style={styles.pickerContainer}>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'emoji' && styles.activeTabBtn]}
          onPress={() => setActiveTab('emoji')}
        >
          <Text style={[styles.tabText, activeTab === 'emoji' && styles.activeTabText]}>😊 Emojis</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'sticker' && styles.activeTabBtn]}
          onPress={() => setActiveTab('sticker')}
        >
          <Text style={[styles.tabText, activeTab === 'sticker' && styles.activeTabText]}>🖼️ Stickers</Text>
        </TouchableOpacity>
      </View>

      {/* Grid content */}
      <View style={styles.gridWrapper}>
        {activeTab === 'emoji' ? (
          <FlatList
            data={EMOJIS}
            keyExtractor={(item, index) => `emoji-${index}`}
            numColumns={8}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.emojiItem}
                onPress={() => onSelectEmoji(item)}
              >
                <Text style={styles.emojiChar}>{item}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <FlatList
            data={STICKERS}
            keyExtractor={item => item.id}
            numColumns={4}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.stickerItem}
                onPress={() => onSelectSticker(item.url)}
              >
                <Image
                  source={{ uri: item.url }}
                  style={styles.stickerThumb}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    height: 230,
    backgroundColor: '#1E1B30',
    borderTopWidth: 1,
    borderTopColor: '#292440',
  },
  tabsRow: {
    flexDirection: 'row',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#292440',
  },
  tabBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  gridWrapper: {
    flex: 1,
    padding: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  emojiItem: {
    width: `${100 / 8}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  emojiChar: {
    fontSize: 26,
  },
  stickerItem: {
    width: '25%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  stickerThumb: {
    width: '100%',
    height: '100%',
  },
});
