import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { colors, textPresets, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';
import { formatCompactNumber } from '../../utils/formatNumbers';

const TABS = ['Hosts', 'Regaladores', 'Salas', 'Juegos'];

const MOCK_RANKING = [
  { id: '1', rank: 1, name: 'EstrellaNinja', score: 1500000, emoji: '🌟' },
  { id: '2', rank: 2, name: 'JuanPerez', score: 980000, emoji: '🔥' },
  { id: '3', rank: 3, name: 'GamerGirl', score: 450000, emoji: '👑' },
  { id: '4', rank: 4, name: 'ChicoTaco', score: 200000, emoji: '🌮' },
];

export const RankingsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.rankItem}>
      <Text style={[styles.rankNumber, item.rank <= 3 && styles.topRank]}>#{item.rank}</Text>
      <View style={styles.avatarPlaceholder}>
        <Text>{item.emoji}</Text>
      </View>
      <View style={styles.nameContainer}>
        <Text style={styles.name}>{item.name}</Text>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>{formatCompactNumber(item.score)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader 
        title="Rankings" 
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onWalletPress={() => navigation.navigate('Wallet')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />
      
      <View style={styles.tabsContainer}>
        {TABS.map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={MOCK_RANKING}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  activeTab: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { ...textPresets.bodySmall, color: colors.textMuted },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  list: { padding: spacing.xl },
  rankItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  rankNumber: { ...textPresets.h3, color: colors.textMuted, width: 40 },
  topRank: { color: colors.primary },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#292440', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  nameContainer: { flex: 1 },
  name: { ...textPresets.bodyMedium, color: colors.text, fontWeight: 'bold' },
  scoreContainer: { backgroundColor: 'rgba(255, 184, 0, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  scoreText: { ...textPresets.caption, color: '#FFB800', fontWeight: 'bold' },
});
