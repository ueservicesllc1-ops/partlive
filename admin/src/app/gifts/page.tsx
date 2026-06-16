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

const emptyGift = {
  name: '',
  description: '',
  iconEmoji: '🎁',
  priceDiamonds: 0,
  beansValue: 0,
  rarity: 'common',
  category: 'popular',
  isActive: true,
  sortOrder: 0,
  iconUrl: '',
  animationUrl: '',
  roomEffectType: '',
  animationType: 'small',
  senderTitle: '',
  senderTitleDurationDays: 0,
  hostBadge: '',
  hostBadgeDurationDays: 0
};

export default function GiftsPage() {
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [giftModal, setGiftModal] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });
  const [form, setForm] = useState({ ...emptyGift });
  const [saving, setSaving] = useState(false);

  const fetchGifts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/admin/gifts');
      setGifts(Array.isArray(data) ? data : []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGifts(); }, []);

  const openCreate = () => {
    setForm({ ...emptyGift });
    setGiftModal({ open: true, editing: null });
  };

  const openEdit = (gift: any) => {
    setForm({
      ...emptyGift,
      ...gift
    });
    setGiftModal({ open: true, editing: gift });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (giftModal.editing) {
        await api.patch(`/api/admin/gifts/${giftModal.editing.id}`, form);
      } else {
        await api.post('/api/admin/gifts', form);
      }
      setGiftModal({ open: false, editing: null });
      await fetchGifts();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (gift: any) => {
    try {
      await api.patch(`/api/admin/gifts/${gift.id}`, { isActive: !gift.isActive });
      await fetchGifts();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <AdminLayout title="Regalos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Regalos</h1>
            <p className="mt-1 text-sm text-gray-500">Administra el catálogo de regalos virtuales</p>
          </div>
          <Button variant="primary" onClick={openCreate}>+ Nuevo Regalo</Button>
        </div>

        {loading && <LoadingState message="Cargando regalos..." />}
        {error && <ErrorState message={error} onRetry={fetchGifts} />}
        {!loading && !error && gifts.length === 0 && (
          <EmptyState icon="🎁" title="No hay regalos" message="Crea el primer regalo del catálogo" action={<Button variant="primary" onClick={openCreate}>Crear Regalo</Button>} />
        )}

        {!loading && !error && gifts.length > 0 && (
          <Table headers={['Regalo', 'Categoría', 'Precio (Diamonds)', 'Valor (Beans)', 'Rareza', 'Efecto / Recompensas', 'Estado', 'Acciones']}>
            {gifts.map((gift: any) => (
              <tr key={gift.id} className="hover:bg-gray-900/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{gift.iconEmoji || gift.localEmoji || '🎁'}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{gift.name}</p>
                      <p className="text-xs text-gray-500">{gift.description || 'Sin descripción'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300 capitalize">{gift.category}</td>
                <td className="px-6 py-4 text-sm font-mono text-blue-400">💎 {gift.priceDiamonds || gift.valueDiamonds || 0}</td>
                <td className="px-6 py-4 text-sm font-mono text-amber-500">🫘 {gift.beansValue || gift.beansValue || 0}</td>
                <td className="px-6 py-4">
                  <Badge variant={gift.rarity === 'legendary' ? 'violet' : gift.rarity === 'epic' ? 'danger' : gift.rarity === 'rare' ? 'info' : 'muted'}>
                    {gift.rarity}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400 space-y-1">
                  {gift.roomEffectType && <div>🎬 Efecto: <span className="text-purple-400 font-semibold">{gift.roomEffectType}</span> ({gift.animationType})</div>}
                  {gift.senderTitle && <div>👤 Emisor: <span className="text-blue-400">[{gift.senderTitle}]</span> {gift.senderTitleDurationDays}d</div>}
                  {gift.hostBadge && <div>🎙️ Host: <span className="text-yellow-400">[{gift.hostBadge}]</span> {gift.hostBadgeDurationDays}d</div>}
                  {!gift.roomEffectType && !gift.senderTitle && !gift.hostBadge && <span className="text-gray-600">-</span>}
                </td>
                <td className="px-6 py-4">
                  {gift.isActive ? <Badge variant="success" dot>Activo</Badge> : <Badge variant="muted">Inactivo</Badge>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1.5">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(gift)}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(gift)}>
                      {gift.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Gift Form Modal */}
      <Modal isOpen={giftModal.open} onClose={() => setGiftModal({ open: false, editing: null })} title={giftModal.editing ? 'Editar Regalo' : 'Nuevo Regalo'}>
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Guitarra Eléctrica" />
            <Input label="Emoji Icono" value={form.iconEmoji} onChange={e => setForm({ ...form, iconEmoji: e.target.value })} placeholder="🎸" />
          </div>
          <Textarea label="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Descripción del regalo" />
          
          <div className="grid grid-cols-2 gap-3">
            <Input label="Precio (Diamonds)" type="number" value={form.priceDiamonds} onChange={e => setForm({ ...form, priceDiamonds: Number(e.target.value) })} />
            <Input label="Beans al Host" type="number" value={form.beansValue} onChange={e => setForm({ ...form, beansValue: Number(e.target.value) })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Categoría" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              options={[
                { label: 'Popular', value: 'popular' },
                { label: 'Música/Karaoke', value: 'music' },
                { label: 'PK/Batallas', value: 'battle' },
                { label: 'Juegos', value: 'juegos' },
                { label: 'VIP/Exclusivos', value: 'vip' }
              ]} />
            <Select label="Rareza" value={form.rarity} onChange={e => setForm({ ...form, rarity: e.target.value })}
              options={[{ label: 'Común', value: 'common' }, { label: 'Raro', value: 'rare' }, { label: 'Épico', value: 'epic' }, { label: 'Legendario', value: 'legendary' }]} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Efecto Visual (roomEffectType)" value={form.roomEffectType} onChange={e => setForm({ ...form, roomEffectType: e.target.value })} placeholder="E.g. confetti_rain" />
            <Select label="Tipo de Animación" value={form.animationType} onChange={e => setForm({ ...form, animationType: e.target.value as any })}
              options={[{ label: 'Pequeña (Small)', value: 'small' }, { label: 'Grande (Big)', value: 'big' }, { label: 'Global', value: 'global' }]} />
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-gray-800 pt-3">
            <Input label="Título para Emisor" value={form.senderTitle} onChange={e => setForm({ ...form, senderTitle: e.target.value })} placeholder="E.g. Rey de la Pista" />
            <Input label="Duración del Título (días)" type="number" value={form.senderTitleDurationDays} onChange={e => setForm({ ...form, senderTitleDurationDays: Number(e.target.value) })} />
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-gray-800 pt-3">
            <Input label="Medalla para Host" value={form.hostBadge} onChange={e => setForm({ ...form, hostBadge: e.target.value })} placeholder="E.g. Estrella del Show" />
            <Input label="Duración de Medalla (días)" type="number" value={form.hostBadgeDurationDays} onChange={e => setForm({ ...form, hostBadgeDurationDays: Number(e.target.value) })} />
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-gray-800 pt-3">
            <Input label="URL Icono (opcional)" value={form.iconUrl} onChange={e => setForm({ ...form, iconUrl: e.target.value })} placeholder="https://..." />
            <Input label="Sort Order" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </div>

          <div className="border-t border-gray-800 pt-3">
            <Select label="Estado" value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}
              options={[{ label: 'Activo', value: 'true' }, { label: 'Inactivo', value: 'false' }]} />
          </div>

          <Button variant="primary" className="w-full" onClick={handleSave} isLoading={saving}>
            {giftModal.editing ? 'Guardar Cambios' : 'Crear Regalo'}
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}

