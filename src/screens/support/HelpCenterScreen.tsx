import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { colors, spacing } from '../../theme';
import { MainHeader } from '../../components/navigation/MainHeader';

export const HelpCenterScreen = ({ navigation }: any) => {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Ticket Form
  const [category, setCategory] = useState('PAYMENT');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHelpData = async () => {
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const artRes = await apiFetch<any>(`/help/articles?query=${encodeURIComponent(query)}`);
      const tickRes = await apiFetch<any>('/support/tickets');

      setArticles(artRes.articles || []);
      setMyTickets(tickRes.tickets || []);
    } catch (err) {
      console.error('Error fetching help data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHelpData();
  }, [query]);

  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Atención', 'Por favor ingresa un asunto y descripción.');
      return;
    }

    setSubmitting(true);
    try {
      const { apiFetch } = await import('../../services/api/apiClient');
      const res = await apiFetch<any>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ category, subject, description }),
      });

      Alert.alert('Ticket Creado', `Tu ticket #${res.ticket.id.slice(-6)} fue creado exitosamente con prioridad ${res.ticket.priority}.`);
      setModalVisible(false);
      setSubject('');
      setDescription('');
      fetchHelpData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear el ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <MainHeader
        title="❓ Centro de Ayuda"
        showWallet={false}
        onSearchPress={() => navigation.navigate('Search')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onMessagesPress={() => navigation.navigate('PrivateConversations')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Search */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>¿En qué te podemos ayudar hoy?</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar artículos (ej. Coins, Retiros, Pagos)..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Artículos Frecuentes</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            articles.map((art) => (
              <TouchableOpacity key={art.articleId} style={styles.articleCard}>
                <Text style={styles.artTitle}>{art.title}</Text>
                <Text style={styles.artSummary}>{art.summary}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* My Tickets */}
        <View style={styles.section}>
          <View style={styles.rowHeader}>
            <Text style={styles.sectionTitle}>🎫 Mis Tickets de Soporte</Text>
            <TouchableOpacity style={styles.contactBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.contactBtnText}>+ Crear Ticket</Text>
            </TouchableOpacity>
          </View>

          {myTickets.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No tienes tickets de soporte creados</Text>
            </View>
          ) : (
            myTickets.map((t) => (
              <View key={t.id} style={styles.ticketCard}>
                <View style={styles.ticketHead}>
                  <Text style={styles.ticketSubj}>{t.subject}</Text>
                  <Text style={styles.ticketStatus}>{t.status}</Text>
                </View>
                <Text style={styles.ticketDesc}>{t.description}</Text>
                <Text style={styles.ticketMeta}>Categoría: {t.category} • Prioridad: {t.priority}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Ticket Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Contactar a Soporte PartyLive</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Asunto (ej. No recibí mis Coins)"
              placeholderTextColor={colors.textMuted}
              value={subject}
              onChangeText={setSubject}
            />

            <TextInput
              style={[styles.modalInput, { height: 100 }]}
              placeholder="Describe tu problema en detalle..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTicket} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.submitText}>Enviar Ticket</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  searchCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 8,
  },
  searchTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  searchInput: {
    backgroundColor: '#1E1B30',
    color: '#FFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
  },
  section: {
    gap: 10,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  contactBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  contactBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  articleCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 4,
  },
  artTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  artSummary: {
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyBox: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#141124',
    borderRadius: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  ticketCard: {
    backgroundColor: '#141124',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26203D',
    gap: 4,
  },
  ticketHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketSubj: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  ticketStatus: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  ticketDesc: {
    fontSize: 12,
    color: colors.textMuted,
  },
  ticketMeta: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: '#141124',
    borderRadius: 16,
    padding: spacing.md,
    gap: 12,
    borderWidth: 1,
    borderColor: '#26203D',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalInput: {
    backgroundColor: '#1E1B30',
    color: '#FFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  submitText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
