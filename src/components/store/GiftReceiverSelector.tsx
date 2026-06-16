import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, textPresets } from '../../theme';
import { Avatar } from '../Avatar';

export interface Receiver {
  userId: string;
  displayName: string;
  photoURL?: string;
}

interface GiftReceiverSelectorProps {
  receivers: Receiver[];
  selectedReceiver: Receiver | null;
  onSelectReceiver: (receiver: Receiver) => void;
}

export const GiftReceiverSelector: React.FC<GiftReceiverSelectorProps> = ({
  receivers,
  selectedReceiver,
  onSelectReceiver,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Destinatario</Text>
      {receivers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No hay otros usuarios en la sala para enviar regalos.
          </Text>
        </View>
      ) : (
        <FlatList
          data={receivers}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedReceiver?.userId === item.userId;
            return (
              <TouchableOpacity
                style={[
                  styles.card,
                  isSelected && styles.cardActive,
                ]}
                activeOpacity={0.8}
                onPress={() => onSelectReceiver(item)}
              >
                <View style={styles.avatarWrapper}>
                  <Avatar source={item.photoURL} emoji="👤" size={44} />
                  {isSelected && <View style={styles.badgeActive} />}
                </View>
                <Text
                  style={[
                    styles.name,
                    isSelected && styles.nameActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.displayName.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  title: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingVertical: 4,
  },
  card: {
    width: 74,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
    shadowColor: colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  avatarWrapper: {
    position: 'relative',
  },
  badgeActive: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: '#1E1B30',
  },
  name: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
    width: '100%',
    fontWeight: '500',
  },
  nameActive: {
    color: colors.text,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...textPresets.bodySmall,
    color: colors.textDark,
    textAlign: 'center',
  },
});
