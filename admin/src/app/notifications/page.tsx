'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { api } from '@/services/apiClient';

const TARGET_TYPES = [
  { label: 'Usuario Único', value: 'user' },
  { label: 'Transmisión Global (FCM Broadcast)', value: 'broadcast' },
];

const ACTION_TYPES = [
  { label: 'Ninguno / General', value: 'none' },
  { label: 'Abrir Misiones', value: 'open_missions' },
  { label: 'Abrir Billetera', value: 'open_wallet' },
  { label: 'Abrir Perfil de Usuario', value: 'open_profile' },
  { label: 'Abrir Sala de Voz', value: 'open_room' },
  { label: 'Abrir Transmisión en Vivo', value: 'open_live' },
  { label: 'Abrir Payout Details', value: 'open_payout' },
  { label: 'Abrir URL Externa', value: 'open_url' },
];

export default function SendNotificationPage() {
  const [targetType, setTargetType] = useState('user');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [actionType, setActionType] = useState('none');
  const [actionValue, setActionValue] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) {
      alert('El título y mensaje son obligatorios.');
      return;
    }
    if (targetType === 'user' && !userId) {
      alert('Debes ingresar el ID del usuario de destino.');
      return;
    }

    setLoading(true);
    try {
      if (targetType === 'user') {
        await api.post('/api/notifications/admin/send-user', {
          userId,
          title,
          body,
          actionType,
          actionValue,
          sendPush,
        });
        alert('Notificación enviada con éxito al usuario.');
      } else {
        await api.post('/api/notifications/admin/send-broadcast', {
          title,
          body,
          actionType,
          actionValue,
        });
        alert('Broadcast programado y enviado a todos los usuarios.');
      }

      // Clear form
      setUserId('');
      setTitle('');
      setBody('');
      setActionValue('');
    } catch (err: any) {
      alert(err.message || 'Error al enviar la notificación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Enviar Notificación">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Enviar Notificaciones Push / In-App</h1>
          <p className="mt-1 text-sm text-gray-400">
            Envía mensajes dirigidos a un usuario o difunde una alerta global al instante.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
          <Select
            label="Destino de la Notificación"
            options={TARGET_TYPES}
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
          />

          {targetType === 'user' && (
            <Input
              label="ID de Usuario Destinatario (userId)"
              placeholder="Ingresa el uid de Firebase del usuario..."
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          )}

          <Input
            label="Título de la Notificación"
            placeholder="Título llamativo, ej: ¡Nuevas recompensas!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Textarea
            label="Mensaje / Cuerpo de la Alerta"
            placeholder="Escribe el cuerpo de la notificación..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Acción al Tocar"
              options={ACTION_TYPES}
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
            />

            <Input
              label="Valor de la Acción (Opcional)"
              placeholder="Ej: roomId, payoutId o URL..."
              value={actionValue}
              onChange={(e) => setActionValue(e.target.value)}
              disabled={actionType === 'none'}
            />
          </div>

          {targetType === 'user' && (
            <label className="flex items-center gap-2 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendPush}
                onChange={(e) => setSendPush(e.target.checked)}
                className="rounded border-gray-800 bg-gray-950 text-violet-500 focus:ring-violet-500/50"
              />
              <span className="text-sm text-gray-300">Despachar también vía Push (FCM Multicast)</span>
            </label>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" variant="primary" isLoading={loading}>
              🚀 Enviar Notificación
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
