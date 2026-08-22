import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * ReactionBurstLayer — Secondary emoji reactions bar (🔥 😂 👏 🎉).
 *
 * NOTE: The primary 👍 Tap Like interaction is handled separately
 * by TapLikeOverlay (full-screen tap zone + particle system).
 * This bar provides supplementary emoji expressions only.
 */

const REACTION_EMOJIS = ['🔥', '😂', '👏', '🎉', '😍'];

interface FloatingParticle {
  id: string;
  emoji: string;
  left: number;
}

export const ReactionBurstLayer: React.FC = () => {
  const [reactions, setReactions] = useState<FloatingParticle[]>([]);

  const handleTriggerReaction = (emoji: string) => {
    const newId = Date.now() + '_' + Math.random();
    const randomLeft = Math.floor(Math.random() * 160) + 20;

    setReactions((prev) => [...prev.slice(-12), { id: newId, emoji, left: randomLeft }]);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newId));
    }, 2000);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Floating reaction particles */}
      <View style={styles.floatingArea} pointerEvents="none">
        {reactions.map((r) => (
          <Text key={r.id} style={[styles.floatingEmoji, { left: r.left }]}>
            {r.emoji}
          </Text>
        ))}
      </View>

      {/* Emoji reaction bar */}
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
    width: 200,
    height: 180,
    position: 'relative',
  },
  floatingEmoji: {
    position: 'absolute',
    bottom: 0,
    fontSize: 24,
  },
  reactionBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 17, 36, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  reactionBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  reactionEmoji: {
    fontSize: 22,
  },
});
