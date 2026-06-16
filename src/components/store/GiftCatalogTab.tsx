import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Gift } from '../../types';
import { colors, spacing, textPresets } from '../../theme';

interface GiftCatalogTabProps {
  gifts: Gift[];
  loading: boolean;
  selectedGift: Gift | null;
  onSelectGift: (gift: Gift) => void;
  quantity: number;
  onChangeQuantity: (qty: number) => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9D97B8',
  rare: colors.accent,
  epic: colors.primary,
  legendary: colors.gold,
};

const QUICK_QUANTITIES = [1, 5, 10, 99];

import { ScrollView } from 'react-native';

const CATEGORIES = [
  { label: 'Todo', value: 'all' },
  { label: 'Popular', value: 'popular' },
  { label: 'Música', value: 'music' },
  { label: 'Batallas', value: 'battle' },
  { label: 'Juegos', value: 'juegos' },
  { label: 'VIP', value: 'vip' },
];

export const GiftCatalogTab: React.FC<GiftCatalogTabProps> = ({
  gifts,
  loading,
  selectedGift,
  onSelectGift,
  quantity,
  onChangeQuantity,
}) => {
  const [customQtyText, setCustomQtyText] = useState(String(quantity));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleCustomQtyChange = (text: string) => {
    // Only allow digits
    const cleaned = text.replace(/[^0-9]/g, '');
    setCustomQtyText(cleaned);
    
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num > 0 && num <= 99) {
      onChangeQuantity(num);
    }
  };

  const handleQuickQtySelect = (qty: number) => {
    onChangeQuantity(qty);
    setCustomQtyText(String(qty));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando catálogo...</Text>
      </View>
    );
  }

  const filteredGifts = selectedCategory === 'all'
    ? gifts
    : gifts.filter((g) => g.category === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Horizontal Category Selector */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isCatActive = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryTab,
                  isCatActive && styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    isCatActive && styles.categoryTabTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredGifts}
        numColumns={3}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => {
          const isSelected = selectedGift?.id === item.id;
          const rarityColor = RARITY_COLORS[item.rarity] || '#FFF';
          
          return (
            <TouchableOpacity
              style={[
                styles.giftCard,
                isSelected && styles.giftCardActive,
                { borderColor: isSelected ? colors.primary : 'rgba(41, 36, 64, 0.5)' }
              ]}
              activeOpacity={0.8}
              onPress={() => onSelectGift(item)}
            >
              {/* Rarity Tag */}
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                <Text style={styles.rarityText}>
                  {item.rarity.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.giftEmoji}>{item.iconEmoji || '🎁'}</Text>
              <Text style={styles.giftName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.giftPrice}>
                💎 {item.priceDiamonds}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Quantity Selector at the bottom */}
      <View style={styles.quantityContainer}>
        <Text style={styles.qtyLabel}>Cantidad:</Text>
        
        <View style={styles.quickQtyRow}>
          {QUICK_QUANTITIES.map((qty) => {
            const isSelected = quantity === qty;
            return (
              <TouchableOpacity
                key={qty}
                style={[
                  styles.quickQtyBtn,
                  isSelected && styles.quickQtyBtnActive,
                ]}
                onPress={() => handleQuickQtySelect(qty)}
              >
                <Text
                  style={[
                    styles.quickQtyText,
                    isSelected && styles.quickQtyTextActive,
                  ]}
                >
                  x{qty}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.qtyInput}
              value={customQtyText}
              onChangeText={handleCustomQtyChange}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="1-99"
              placeholderTextColor={colors.textDark}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  gridContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  giftCard: {
    width: '31%',
    aspectRatio: 0.95,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    position: 'relative',
    overflow: 'hidden',
  },
  giftCardActive: {
    backgroundColor: 'rgba(138, 79, 255, 0.08)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  rarityBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 1.5,
    alignItems: 'center',
  },
  rarityText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  giftEmoji: {
    fontSize: 28,
    marginTop: spacing.xs,
  },
  giftName: {
    ...textPresets.bodySmall,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  giftPrice: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  qtyLabel: {
    ...textPresets.bodySmall,
    color: colors.textMuted,
    fontWeight: '600',
  },
  quickQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickQtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickQtyBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickQtyText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  quickQtyTextActive: {
    color: '#FFF',
  },
  inputWrapper: {
    width: 44,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    padding: 0,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  categoryContainer: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
    flexDirection: 'row',
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  categoryTabTextActive: {
    color: '#FFF',
  },
});
