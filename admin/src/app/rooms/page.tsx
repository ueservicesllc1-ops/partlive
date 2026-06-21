'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState, ConfirmDialog } from '@/components/ui/Extras';
import { api } from '@/services/apiClient';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState<string | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleClose = async (roomId: string) => {
    setActionLoading(`close-${roomId}`);
    try {
      await api.post(`/api/admin/rooms/${roomId}/close`);
      setConfirmClose(null);
      await fetchRooms();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleSuspend = async (roomId: string) => {
    setActionLoading(`suspend-${roomId}`);
    try {
      await api.post(`/api/admin/rooms/${roomId}/suspend`, { reason: 'Suspendida por moderación' });
      await fetchRooms();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  return (
    <AdminLayout title="Salas">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Salas de Audio</h1>
          <p className="mt-1 text-sm text-gray-500">Monitorea y modera todas las salas</p>
        </div>

        {loading && <LoadingState message="Cargando salas..." />}
        {error && <ErrorState message={error} onRetry={fetchRooms} />}
        {!loading && !error && rooms.length === 0 && <EmptyState icon="🏠" title="No hay salas" />}

        {!loading && !error && rooms.length > 0 && (
          <Table headers={['Sala', 'Categoría', 'País/Idioma', 'Acceso/Visib.', 'Oyentes', 'Estado', 'Fecha', 'Acciones']}>
            {rooms.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-900/40 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{r.title || 'Sin título'}</p>
                    <p className="text-xs text-gray-500">Host: {r.ownerName || r.ownerId || '—'}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">{r.category || '—'}</td>
                <td className="px-6 py-4 text-xs text-gray-400">
                  <p>{r.countryName || r.countryCode || '—'}</p>
                  <p className="text-gray-600">{r.languageName || r.languageCode || '—'}</p>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400">
                  <p className="font-semibold text-white">{r.visibility ? r.visibility.toUpperCase() : 'PUBLIC'}</p>
                  <p className="text-gray-600">{r.accessType || 'open'}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {r.listenersUnlimited ? `${r.currentListenersCount || 0}/∞` : `${r.listenersCount || 0}/${r.maxListeners || '—'}`}
                </td>
                <td className="px-6 py-4">
                  {r.status === 'active' ? <Badge variant="success" dot>Activa</Badge> :
                   r.status === 'suspended' ? <Badge variant="danger">Suspendida</Badge> :
                   <Badge variant="muted">{r.status}</Badge>}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString('es') : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1.5">
                    <Link href={`/rooms/${r.id}`}><Button variant="ghost" size="sm">Ver</Button></Link>
                    {r.status === 'active' && (
                      <>
                        <Button variant="danger" size="sm" onClick={() => setConfirmClose(r.id)}>Cerrar</Button>
                        <Button variant="warning" size="sm" isLoading={actionLoading === `suspend-${r.id}`}
                          onClick={() => handleSuspend(r.id)}>Suspender</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmClose}
        onClose={() => setConfirmClose(null)}
        onConfirm={() => confirmClose && handleClose(confirmClose)}
        title="Cerrar Sala"
        message="¿Confirmas cerrar esta sala? Todos los participantes serán desconectados."
        confirmLabel="Cerrar Sala"
        variant="danger"
        isLoading={actionLoading?.startsWith('close')}
      />
    </AdminLayout>
  );
}
