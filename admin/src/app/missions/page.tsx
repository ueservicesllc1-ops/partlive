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

const STATUS_LABELS: Record<string, { label: string; badge: 'success' | 'danger' | 'warning' | 'muted' }> = {
  active: { label: 'Activo', badge: 'success' },
  inactive: { label: 'Inactivo', badge: 'danger' },
  scheduled: { label: 'Programado', badge: 'warning' },
  ended: { label: 'Finalizado', badge: 'muted' },
};

const ACTION_TYPES = [
  { label: 'Login Diario', value: 'daily_login' },
  { label: 'Unirse a Sala', value: 'join_room' },
  { label: 'Permanecer en Sala (minutos)', value: 'stay_in_room_minutes' },
  { label: 'Ver Live (minutos)', value: 'watch_live_minutes' },
  { label: 'Enviar Mensaje', value: 'send_message' },
  { label: 'Enviar Regalo', value: 'send_gift' },
  { label: 'Recibir Regalo', value: 'receive_gift' },
  { label: 'Jugar Partida', value: 'play_game' },
  { label: 'Ganar Partida', value: 'win_game' },
  { label: 'Seguir Usuario', value: 'follow_user' },
  { label: 'Invitar Amigo', value: 'invite_friend' },
  { label: 'Iniciar Transmisión', value: 'start_live' },
  { label: 'Crear Sala', value: 'create_room' },
  { label: 'Transmitir Live (minutos)', value: 'host_live_minutes' },
];

const REWARD_TYPES = [
  { label: 'Experiencia (XP)', value: 'xp' },
  { label: 'Diamantes', value: 'diamonds' },
  { label: 'Beans (Semillas)', value: 'beans' },
  { label: 'Medalla/Badge', value: 'badge' },
  { label: 'Puntos de Evento', value: 'event_points' },
  { label: 'Prueba VIP', value: 'vip_trial' },
  { label: 'Ticket de Regalo', value: 'gift_ticket' },
];

const MISSION_TYPES = [
  { label: 'Diaria', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Host', value: 'host' },
  { label: 'VIP', value: 'vip' },
  { label: 'Evento Especial', value: 'event' },
  { label: 'Nuevo Usuario', value: 'new_user' },
];

export default function MissionsAdminPage() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal for Create/Edit
  const [editorModal, setEditorModal] = useState<{ open: boolean; mission: any | null }>({ open: false, mission: null });
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    type: 'daily',
    actionType: 'daily_login',
    targetValue: 1,
    rewardType: 'xp',
    rewardAmount: 10,
    status: 'active',
    sortOrder: 1,
    isRepeatable: true,
    maxClaimsPerUser: 1,
    requiresVip: false,
    requiresHost: false,
  });

  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchMissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/admin/missions');
      setMissions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const openAdd = () => {
    setFormValues({
      title: '',
      description: '',
      type: 'daily',
      actionType: 'daily_login',
      targetValue: 1,
      rewardType: 'xp',
      rewardAmount: 10,
      status: 'active',
      sortOrder: 1,
      isRepeatable: true,
      maxClaimsPerUser: 1,
      requiresVip: false,
      requiresHost: false,
    });
    setEditorModal({ open: true, mission: null });
  };

  const openEdit = (m: any) => {
    setFormValues({
      title: m.title || '',
      description: m.description || '',
      type: m.type || 'daily',
      actionType: m.actionType || 'daily_login',
      targetValue: m.targetValue || 1,
      rewardType: m.rewardType || 'xp',
      rewardAmount: m.rewardAmount || 10,
      status: m.status || 'active',
      sortOrder: m.sortOrder || 1,
      isRepeatable: m.isRepeatable ?? true,
      maxClaimsPerUser: m.maxClaimsPerUser || 1,
      requiresVip: m.requiresVip ?? false,
      requiresHost: m.requiresHost ?? false,
    });
    setEditorModal({ open: true, mission: m });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editorModal.mission) {
        // Edit Mode
        await api.patch(`/api/admin/missions/${editorModal.mission.id}`, formValues);
      } else {
        // Create Mode
        await api.post('/api/admin/missions', formValues);
      }
      setEditorModal({ open: false, mission: null });
      await fetchMissions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (missionId: string, currentStatus: string) => {
    try {
      const endpoint = currentStatus === 'active' ? 'deactivate' : 'activate';
      await api.post(`/api/admin/missions/${missionId}/${endpoint}`);
      await fetchMissions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.post('/api/admin/missions/seed');
      await fetchMissions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <AdminLayout title="Misiones">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Misiones y Retos</h1>
            <p className="mt-1 text-sm text-gray-400">Administra las misiones diarias, semanales y eventos de PartyLiveApp.</p>
          </div>
          <div className="flex gap-3">
            {missions.length === 0 && (
              <Button onClick={handleSeed} isLoading={seeding} variant="secondary">
                🌱 Sembrar Predeterminadas
              </Button>
            )}
            <Button onClick={openAdd} variant="primary">
              ＋ Crear Misión
            </Button>
          </div>
        </div>

        {loading && <LoadingState message="Cargando misiones..." />}
        {error && <ErrorState message={error} onRetry={fetchMissions} />}
        {!loading && !error && missions.length === 0 && (
          <EmptyState icon="🎯" title="No hay misiones" message="Crea una nueva misión o siembra las predeterminadas." />
        )}

        {!loading && !error && missions.length > 0 && (
          <Table headers={['Orden', 'Misión', 'Tipo', 'Acción Objetivo', 'Recompensa', 'Requisitos', 'Estado', 'Acciones']}>
            {missions.map((m: any) => {
              const status = STATUS_LABELS[m.status] || { label: m.status, badge: 'muted' as const };
              return (
                <tr key={m.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">{m.sortOrder}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{m.title}</div>
                    <div className="text-xs text-gray-500">{m.description}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold capitalize text-violet-400">{m.type}</td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-300">
                    {m.actionType} ({m.targetValue})
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-emerald-400">
                    {m.rewardType === 'diamonds' ? '💎' : m.rewardType === 'beans' ? '🫘' : '⚡'} {m.rewardAmount} {m.rewardType.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {m.requiresVip && <span className="block text-amber-400">👑 VIP Required</span>}
                    {m.requiresHost && <span className="block text-blue-400">🎙️ Host Required</span>}
                    {!m.requiresVip && !m.requiresHost && <span>—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={status.badge} dot>{status.label}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(m)}>
                        Editar
                      </Button>
                      <Button 
                        variant={m.status === 'active' ? 'danger' : 'success'} 
                        size="sm" 
                        onClick={() => handleToggleActive(m.id, m.status)}
                      >
                        {m.status === 'active' ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={editorModal.open} onClose={() => setEditorModal({ open: false, mission: null })} title={editorModal.mission ? 'Editar Misión' : 'Nueva Misión'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Título"
            value={formValues.title}
            onChange={e => setFormValues({ ...formValues, title: e.target.value })}
            placeholder="Título llamativo, ej. Completa 5 partidas"
            required
          />

          <Textarea
            label="Descripción"
            value={formValues.description}
            onChange={e => setFormValues({ ...formValues, description: e.target.value })}
            placeholder="Describe qué debe hacer el usuario..."
            rows={2}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Misión"
              options={MISSION_TYPES}
              value={formValues.type}
              onChange={e => setFormValues({ ...formValues, type: e.target.value })}
            />

            <Select
              label="Acción a realizar"
              options={ACTION_TYPES}
              value={formValues.actionType}
              onChange={e => setFormValues({ ...formValues, actionType: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Valor Objetivo"
              type="number"
              value={formValues.targetValue}
              onChange={e => setFormValues({ ...formValues, targetValue: parseInt(e.target.value) || 1 })}
              min={1}
              required
            />

            <Select
              label="Tipo Recompensa"
              options={REWARD_TYPES}
              value={formValues.rewardType}
              onChange={e => setFormValues({ ...formValues, rewardType: e.target.value })}
            />

            <Input
              label="Monto Recompensa"
              type="number"
              value={formValues.rewardAmount}
              onChange={e => setFormValues({ ...formValues, rewardAmount: parseInt(e.target.value) || 1 })}
              min={1}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Límite Reclamaciones por usuario"
              type="number"
              value={formValues.maxClaimsPerUser}
              onChange={e => setFormValues({ ...formValues, maxClaimsPerUser: parseInt(e.target.value) || 1 })}
              min={1}
              required
            />

            <Input
              label="Orden de Ordenamiento (Visual)"
              type="number"
              value={formValues.sortOrder}
              onChange={e => setFormValues({ ...formValues, sortOrder: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          <div className="flex flex-wrap gap-4 py-2 border-t border-b border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formValues.isRepeatable} 
                onChange={e => setFormValues({ ...formValues, isRepeatable: e.target.checked })}
                className="rounded border-gray-800 bg-gray-950 text-violet-500 focus:ring-violet-500/50"
              />
              <span className="text-sm text-gray-300">Repetible en siguientes periodos</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formValues.requiresVip} 
                onChange={e => setFormValues({ ...formValues, requiresVip: e.target.checked })}
                className="rounded border-gray-800 bg-gray-950 text-violet-500 focus:ring-violet-500/50"
              />
              <span className="text-sm text-gray-300">Requiere VIP</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formValues.requiresHost} 
                onChange={e => setFormValues({ ...formValues, requiresHost: e.target.checked })}
                className="rounded border-gray-800 bg-gray-950 text-violet-500 focus:ring-violet-500/50"
              />
              <span className="text-sm text-gray-300">Requiere Rol de Host</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditorModal({ open: false, mission: null })}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {editorModal.mission ? 'Guardar Cambios' : 'Crear Misión'}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
