import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';
import { StoriesBar } from '../../components/social/StoriesBar';
import { CreatePostModal } from '../../components/social/CreatePostModal';

export const SocialFeedScreen = ({ navigation }: any) => {
  const [feedType, setFeedType] = useState<'FOR_YOU' | 'FOLLOWING'>('FOR_YOU');
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchSocialFeed = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const postsRes = await apiFetch<any>(`/social/posts-api/feed?type=${feedType}`);
      setPosts(postsRes.posts || []);

      const storiesRes = await apiFetch<any>('/stories/feed');
      setStories(storiesRes.stories || []);
    } catch (err) {
      console.error('Error fetching social feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialFeed();
  }, [feedType]);

  const handleLikePost = async (postId: string) => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>(`/social/posts-api/posts/${postId}/like`, { method: 'POST' });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likesCount: res.isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1) }
            : p
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="🌐 Feed Social"
        showWallet={true}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      {/* Stories Bar */}
      <StoriesBar
        stories={stories}
        onSelectStory={(s) => console.log('Story selected:', s.id)}
        onCreateStory={() => setShowCreateModal(true)}
      />

      {/* Feed Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, feedType === 'FOR_YOU' && styles.tabActive]}
          onPress={() => setFeedType('FOR_YOU')}
        >
          <Text style={[styles.tabText, feedType === 'FOR_YOU' && styles.tabTextActive]}>✨ Para Ti</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, feedType === 'FOLLOWING' && styles.tabActive]}
          onPress={() => setFeedType('FOLLOWING')}
        >
          <Text style={[styles.tabText, feedType === 'FOLLOWING' && styles.tabTextActive]}>👥 Siguiendo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Cargando feed social...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {posts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📱</Text>
              <Text style={styles.emptyTitle}>Aún no hay publicaciones</Text>
              <Text style={styles.emptySub}>
                ¡Sé el primero en compartir algo con la comunidad!
              </Text>
            </View>
          ) : (
            posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Text style={styles.authorTitle}>Usuario #{post.authorId?.slice(-6)}</Text>
                  {post.visibility !== 'PUBLIC' && (
                    <Text style={styles.badgeVis}>👑 Suscriptores</Text>
                  )}
                </View>

                <Text style={styles.postBody}>{post.text}</Text>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleLikePost(post.id)}>
                    <Text style={styles.actionIcon}>❤️</Text>
                    <Text style={styles.actionCount}>{post.likesCount || 0}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.actionIcon}>💬</Text>
                    <Text style={styles.actionCount}>{post.commentsCount || 0}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Floating Create Button */}
      <TouchableOpacity style={styles.fabBtn} onPress={() => setShowCreateModal(true)}>
        <Text style={styles.fabText}>+ Publicar</Text>
      </TouchableOpacity>

      <CreatePostModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={fetchSocialFeed}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 8,
    fontSize: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#141124',
    padding: 6,
    borderBottomWidth: 1,
    borderColor: '#26203D',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#FFF',
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141124',
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#26203D',
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  emptySub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 10,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  badgeVis: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  postBody: {
    fontSize: 13,
    color: '#FFF',
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionCount: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    elevation: 6,
  },
  fabText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
