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
  name: '', description: '', localEmoji: '🎁', priceCoins: 0,
  valueDiamonds: 0, rarity: 'common', category: 'general',
  isActive: true, sortOrder: 0, iconUrl: '', animationUrl: '',
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
    setForm({ ...gift });
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
          <Table headers={['Regalo', 'Precio (Coins)', 'Valor (Diamonds)', 'Rareza', 'Estado', 'Acciones']}>
            {gifts.map((gift: any) => (
              <tr key={gift.id} className="hover:bg-gray-900/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{gift.localEmoji || '🎁'}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{gift.name}</p>
                      <p className="text-xs text-gray-500">{gift.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-amber-400">🪙 {gift.priceCoins?.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-mono text-blue-400">💎 {gift.valueDiamonds?.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <Badge variant={gift.rarity === 'legendary' ? 'violet' : gift.rarity === 'rare' ? 'info' : 'muted'}>
                    {gift.rarity}
                  </Badge>
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Rosa" />
            <Input label="Emoji" value={form.localEmoji} onChange={e => setForm({ ...form, localEmoji: e.target.value })} placeholder="🌹" />
          </div>
          <Textarea label="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Precio (Coins)" type="number" value={form.priceCoins} onChange={e => setForm({ ...form, priceCoins: Number(e.target.value) })} />
            <Input label="Valor (Diamonds)" type="number" value={form.valueDiamonds} onChange={e => setForm({ ...form, valueDiamonds: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Rareza" value={form.rarity} onChange={e => setForm({ ...form, rarity: e.target.value })}
              options={[{ label: 'Común', value: 'common' }, { label: 'Raro', value: 'rare' }, { label: 'Épico', value: 'epic' }, { label: 'Legendario', value: 'legendary' }]} />
            <Select label="Estado" value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}
              options={[{ label: 'Activo', value: 'true' }, { label: 'Inactivo', value: 'false' }]} />
          </div>
          <Input label="Sort Order" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          <Button variant="primary" className="w-full" onClick={handleSave} isLoading={saving}>
            {giftModal.editing ? 'Guardar Cambios' : 'Crear Regalo'}
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
