import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const REACTION_EMOJIS = ['❤️', '🔥', '😂', '👏', '🎉'];

export const ReactionBurstLayer: React.FC = () => {
  const [reactions, setReactions] = useState<{ id: string; emoji: string; left: number }[]>([]);

  const handleTriggerReaction = (emoji: string) => {
    const newId = Date.now() + '_' + Math.random();
    const randomLeft = Math.floor(Math.random() * 180) + 20;

    setReactions((prev) => [...prev.slice(-15), { id: newId, emoji, left: randomLeft }]);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newId));
    }, 2000);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Floating particles */}
      <View style={styles.floatingArea} pointerEvents="none">
        {reactions.map((r) => (
          <Text key={r.id} style={[styles.floatingEmoji, { left: r.left }]}>
            {r.emoji}
          </Text>
        ))}
      </View>

      {/* Quick reaction bar */}
      <View style={styles.reactionBar}>
        {REACTION_EMOJIS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={styles.reactionBtn}
            activeOpacity={0.6}
            onPress={() => handleTriggerReaction(emoji)}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    right: 12,
    alignItems: 'center',
  },
  floatingArea: {
    width: 220,
    height: 200,
    position: 'relative',
  },
  floatingEmoji: {
    position: 'absolute',
    bottom: 0,
    fontSize: 26,
  },
  reactionBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 17, 36, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
  },
  reactionBtn: {
    padding: 4,
  },
  reactionEmoji: {
    fontSize: 20,
  },
});
