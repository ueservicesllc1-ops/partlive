import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { colors, spacing, textPresets } from '../theme';
import { Card } from '../components/Card';
import { mockGames } from '../constants/mockData';
import { MainHeader } from '../components/navigation/MainHeader';
import { MAIN_ROUTES } from '../app/routes';

export const GamesScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <MainHeader 
        title="Juegos"
        onSearchPress={() => navigation.navigate(MAIN_ROUTES.SEARCH)}
        onNotificationsPress={() => navigation.navigate(MAIN_ROUTES.NOTIFICATIONS)}
        onWalletPress={() => navigation.navigate(MAIN_ROUTES.WALLET)}
      />
      <FlatList
        data={mockGames}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cardWrapper} onPress={() => navigation.navigate(MAIN_ROUTES.GAME_DETAILS, { gameId: item.id })}>
            <Card
              variant="solid"
              style={[styles.gameCard, { borderTopWidth: 3, borderTopColor: item.color }]}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>

              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.onlineContainer}>
                <View style={styles.pulseDot} />
                <Text style={styles.playersOnline}>
                  👥 {(item.playersOnline / 1000).toFixed(1)}k jugando
                </Text>
              </View>

              <TouchableOpacity style={[styles.playButton, { backgroundColor: item.color }]} activeOpacity={0.8}>
                <Text style={styles.playText}>Jugar ahora</Text>
              </TouchableOpacity>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  row: {
    justifyContent: 'space-between',
  },
  gameCard: {
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  cardWrapper: {
    flex: 0.485,
    marginHorizontal: spacing.xs,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 32,
  },
  name: {
    ...textPresets.bodyLarge,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 14,
    height: 28,
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 4,
  },
  playersOnline: {
    fontSize: 9,
    color: colors.text,
    fontWeight: 'bold',
  },
  playButton: {
    width: '100%',
    paddingVertical: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  playText: {
    fontSize: 12,
    color: '#0B0813', // High contrast color
    fontWeight: 'bold',
  },
});
