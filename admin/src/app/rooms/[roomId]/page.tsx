'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, ConfirmDialog } from '@/components/ui/Extras';
import { api } from '@/services/apiClient';

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomSnap, membersSnap, messagesSnap, bansSnap, reqsSnap] = await Promise.all([
        getDoc(doc(db, 'rooms', roomId)),
        getDocs(query(collection(db, 'rooms', roomId, 'members'), limit(20))),
        getDocs(query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'desc'), limit(20))),
        getDocs(query(collection(db, 'roomBans'), limit(20))), // General ban queries
        getDocs(query(collection(db, 'roomAccessRequests'), limit(20))),
      ]);
      if (!roomSnap.exists()) { setError('Sala no encontrada'); return; }
      setRoom({ id: roomSnap.id, ...roomSnap.data() });
      setMembers(membersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setMessages(messagesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const allBans = bansSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setBans(allBans.filter((b: any) => b.roomId === roomId));

      const allReqs = reqsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setRequests(allReqs.filter((r: any) => r.roomId === roomId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (roomId) fetchData(); }, [roomId]);

  const handleClose = async () => {
    setActionLoading('close');
    try {
      await api.post(`/api/admin/rooms/${roomId}/close`);
      setConfirmClose(false);
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleUnban = async (targetUserId: string) => {
    setActionLoading(`unban-${targetUserId}`);
    try {
      await api.post(`/api/rooms/${roomId}/unban`, { targetUserId });
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  if (loading) return <AdminLayout title="Sala"><LoadingState /></AdminLayout>;
  if (error) return <AdminLayout title="Error"><ErrorState message={error} /></AdminLayout>;
  if (!room) return null;

  return (
    <AdminLayout title={`Sala: ${room.title || 'Sin título'}`}>
      <div className="space-y-6 max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => router.push('/rooms')}>← Volver</Button>

        {/* Room Header */}
        <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-white">{room.title || 'Sin título'}</h2>
              {room.status === 'active'
                ? <Badge variant="success" dot>Activa</Badge>
                : room.status === 'suspended'
                ? <Badge variant="danger">Suspendida</Badge>
                : <Badge variant="muted">{room.status}</Badge>}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Categoría: {room.category || '—'} • Owner: {room.ownerName || room.ownerId || '—'} • Oyentes: {room.listenersUnlimited ? `${room.currentListenersCount || 0}/∞` : room.listenersCount}
            </p>
          </div>
          {room.status === 'active' && (
            <Button variant="danger" size="sm" onClick={() => setConfirmClose(true)} isLoading={actionLoading === 'close'}>
              Cerrar Sala
            </Button>
          )}
        </Card>

        {/* Settings Details Info */}
        <Card>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Detalles de la Sala</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-gray-900/40 p-3 rounded-xl">
              <p className="text-gray-500 font-semibold mb-1">País</p>
              <p className="text-white font-medium text-sm">{room.countryName || room.countryCode || 'Ecuador'}</p>
            </div>
            <div className="bg-gray-900/40 p-3 rounded-xl">
              <p className="text-gray-500 font-semibold mb-1">Idioma</p>
              <p className="text-white font-medium text-sm">{room.languageName || room.languageCode || 'Español'}</p>
            </div>
            <div className="bg-gray-900/40 p-3 rounded-xl">
              <p className="text-gray-500 font-semibold mb-1">Visibilidad</p>
              <p className="text-white font-medium text-sm">{room.visibility ? room.visibility.toUpperCase() : 'PUBLIC'}</p>
            </div>
            <div className="bg-gray-900/40 p-3 rounded-xl">
              <p className="text-gray-500 font-semibold mb-1">Método de Acceso</p>
              <p className="text-white font-medium text-sm">{room.accessType || 'open'}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Members */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
              Miembros ({members.length})
            </h3>
            {members.length === 0 ? (
              <p className="text-sm text-gray-600">No hay miembros activos</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-2 rounded-xl bg-gray-900/60 px-3 py-2">
                    <div className="h-7 w-7 rounded-full bg-violet-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {(m.displayName || m.id)?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{m.displayName || m.id}</p>
                      <p className="text-[10px] text-gray-500">{m.role || 'listener'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Active Bans list */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
              Usuarios Bloqueados ({bans.length})
            </h3>
            {bans.length === 0 ? (
              <p className="text-sm text-gray-600">No hay usuarios bloqueados en esta sala</p>
            ) : (
              <div className="space-y-2">
                {bans.map(b => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl bg-gray-900/60 px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-white">Usuario ID: {b.userId}</p>
                      <p className="text-[10px] text-gray-500">Motivo: {b.reason || 'Baneo general'}</p>
                    </div>
                    <Button variant="warning" size="xs" isLoading={actionLoading === `unban-${b.userId}`} onClick={() => handleUnban(b.userId)}>
                      Desbloquear
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Messages */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
              Mensajes Recientes ({messages.length})
            </h3>
            {messages.length === 0 ? (
              <p className="text-sm text-gray-600">No hay mensajes</p>
            ) : (
              <div className="space-y-2">
                {messages.map(msg => (
                  <div key={msg.id} className="flex gap-3 rounded-xl bg-gray-900/40 px-3 py-2">
                    <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {(msg.senderName || '?')?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-violet-400">{msg.senderName || 'Usuario'}: </span>
                      <span className="text-xs text-gray-300">{msg.text || '[media]'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Access Requests */}
          <Card>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
              Solicitudes de Acceso ({requests.length})
            </h3>
            {requests.length === 0 ? (
              <p className="text-sm text-gray-600">No hay solicitudes de acceso</p>
            ) : (
              <div className="space-y-2">
                {requests.map(r => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl bg-gray-900/60 px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-white">{r.userName || r.userId}</p>
                      <p className="text-[10px] text-gray-500">Estado: {r.status}</p>
                    </div>
                    <Badge variant={r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'}>
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={handleClose}
        title="Cerrar Sala"
        message="¿Confirmas cerrar esta sala? Todos los participantes serán desconectados inmediatamente."
        confirmLabel="Cerrar Sala"
        variant="danger"
        isLoading={actionLoading === 'close'}
      />
    </AdminLayout>
  );
}
