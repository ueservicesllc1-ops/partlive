'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/Extras';
import { api } from '@/services/apiClient';

const emptySong = {
  title: '',
  artist: '',
  language: 'es',
  genre: 'Pop',
  durationSeconds: 180,
  coverUrl: '',
  audioUrl: '',
  instrumentalUrl: '',
  lyricsText: '',
  isFeatured: false,
  tags: '',
};

export default function KaraokeAdminPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [songModal, setSongModal] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });
  const [form, setForm] = useState({ ...emptySong });
  const [saving, setSaving] = useState(false);

  const fetchSongs = async () => {
    setLoading(true);
    setError(null);
    try {
      // In admin panel, query all songs
      const data = await api.get('/api/karaoke/songs');
      setSongs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const openCreate = () => {
    setForm({ ...emptySong });
    setSongModal({ open: true, editing: null });
  };

  const openEdit = (song: any) => {
    setForm({
      ...song,
      tags: Array.isArray(song.tags) ? song.tags.join(', ') : '',
    });
    setSongModal({ open: true, editing: song });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : form.tags,
      };

      if (songModal.editing) {
        await api.patch(`/api/karaoke/admin/songs/${songModal.editing.id}`, payload);
      } else {
        await api.post('/api/karaoke/admin/songs', payload);
      }
      setSongModal({ open: false, editing: null });
      await fetchSongs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (songId: string) => {
    try {
      await api.post(`/api/karaoke/admin/songs/${songId}/approve`);
      await fetchSongs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (songId: string) => {
    const reason = prompt('Razón de rechazo de la canción:');
    if (reason === null) return; // cancelled
    try {
      await api.post(`/api/karaoke/admin/songs/${songId}/reject`, { reason });
      await fetchSongs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeactivate = async (songId: string) => {
    try {
      await api.post(`/api/karaoke/admin/songs/${songId}/deactivate`);
      await fetchSongs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <AdminLayout title="Catálogo de Karaoke">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Catálogo de Karaoke</h1>
            <p className="mt-1 text-sm text-gray-500">Administra, aprueba y sube canciones oficiales para Karaoke</p>
          </div>
          <Button variant="primary" onClick={openCreate}>+ Nueva Canción</Button>
        </div>

        {loading && <LoadingState message="Cargando canciones..." />}
        {error && <ErrorState message={error} onRetry={fetchSongs} />}
        {!loading && !error && songs.length === 0 && (
          <EmptyState
            icon="🎤"
            title="No hay canciones"
            message="El catálogo está vacío. Agrega la primera canción."
            action={<Button variant="primary" onClick={openCreate}>Crear Canción</Button>}
          />
        )}

        {!loading && !error && songs.length > 0 && (
          <Table headers={['Canción', 'Género', 'Idioma', 'Reproducciones', 'Estado', 'Acciones']}>
            {songs.map((song: any) => (
              <tr key={song.id} className="hover:bg-gray-900/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {song.coverUrl ? (
                      <img src={song.coverUrl} className="w-10 h-10 rounded object-cover" alt="" />
                    ) : (
                      <span className="text-2xl">🎵</span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">{song.title}</p>
                      <p className="text-xs text-gray-500">{song.artist}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">{song.genre}</td>
                <td className="px-6 py-4 text-sm text-gray-300 font-semibold uppercase">{song.language}</td>
                <td className="px-6 py-4 text-sm text-gray-300 font-mono">{song.playCount || 0}</td>
                <td className="px-6 py-4">
                  <Badge
                    variant={
                      song.status === 'active'
                        ? 'success'
                        : song.status === 'pending_review'
                        ? 'warning'
                        : 'muted'
                    }
                  >
                    {song.status === 'active'
                      ? 'Activo'
                      : song.status === 'pending_review'
                      ? 'Revisión'
                      : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(song)}>Editar</Button>
                    {song.status === 'pending_review' && (
                      <>
                        <Button variant="success" size="sm" onClick={() => handleApprove(song.id)}>Aprobar</Button>
                        <Button variant="danger" size="sm" onClick={() => handleReject(song.id)}>Rechazar</Button>
                      </>
                    )}
                    {song.status === 'active' && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeactivate(song.id)}>Desactivar</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Song Edit/Create Form Modal */}
      <Modal isOpen={songModal.open} onClose={() => setSongModal({ open: false, editing: null })} title={songModal.editing ? 'Editar Canción' : 'Nueva Canción'}>
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: Amazing Grace" />
            <Input label="Artista" value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })} placeholder="Ej: John Newton" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Idioma (es/en/etc)" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} />
            <Input label="Género" value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duración (segundos)" type="number" value={form.durationSeconds} onChange={e => setForm({ ...form, durationSeconds: Number(e.target.value) })} />
            <Input label="URL de Portada" value={form.coverUrl} onChange={e => setForm({ ...form, coverUrl: e.target.value })} />
          </div>
          <Input label="URL Instrumental (Audio track)" value={form.instrumentalUrl} onChange={e => setForm({ ...form, instrumentalUrl: e.target.value })} />
          <Input label="Tags (separados por coma)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="gospel, traditional" />
          <Textarea label="Letra de la canción" value={form.lyricsText} onChange={e => setForm({ ...form, lyricsText: e.target.value })} rows={5} placeholder="Escribe la letra aquí..." />

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isFeatured" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="rounded bg-gray-900 border-gray-700 text-purple-600 focus:ring-purple-500" />
            <label htmlFor="isFeatured" className="text-sm text-gray-300 font-semibold">Destacar canción (Featured)</label>
          </div>

          <Button variant="primary" className="w-full mt-4" onClick={handleSave} isLoading={saving}>
            {songModal.editing ? 'Guardar Cambios' : 'Crear Canción'}
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
