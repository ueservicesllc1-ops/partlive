'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LoadingState, ErrorState, EmptyState, Pagination } from '@/components/ui/Extras';
import { api } from '@/services/apiClient';

const PAGE_SIZE = 20;

function getRoleBadge(role: string) {
  const map: Record<string, 'violet' | 'info' | 'warning' | 'muted'> = {
    admin: 'violet', moderator: 'info', host: 'warning', user: 'muted',
  };
  return <Badge variant={map[role] || 'muted'}>{role}</Badge>;
}

function getStatusBadge(status: string) {
  if (status === 'active') return <Badge variant="success" dot>Activo</Badge>;
  if (status === 'suspended') return <Badge variant="danger" dot>Suspendido</Badge>;
  return <Badge variant="muted">{status}</Badge>;
}

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (roleFilter) data = data.filter((u: any) => u.role === roleFilter);
      if (statusFilter) data = data.filter((u: any) => u.status === statusFilter);
      if (search) {
        const s = search.toLowerCase();
        data = data.filter((u: any) =>
          u.email?.toLowerCase().includes(s) ||
          u.displayName?.toLowerCase().includes(s) ||
          u.username?.toLowerCase().includes(s)
        );
      }
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchUsers(); };

  const handleAction = async (action: 'suspend' | 'reactivate' | 'verify' | 'unverify', userId: string) => {
    setActionLoading(`${action}-${userId}`);
    try {
      await api.post(`/api/admin/users/${userId}/${action}`);
      await fetchUsers();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout title="Usuarios">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Usuarios</h1>
            <p className="mt-1 text-sm text-gray-500">Gestiona todos los usuarios de la plataforma</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por email, nombre, usuario..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="primary" size="md">Buscar</Button>
          </form>
          <Select
            options={[
              { label: 'Todos los roles', value: '' },
              { label: 'Admin', value: 'admin' },
              { label: 'Moderator', value: 'moderator' },
              { label: 'Host', value: 'host' },
              { label: 'User', value: 'user' },
            ]}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-44"
          />
          <Select
            options={[
              { label: 'Todos los estados', value: '' },
              { label: 'Activo', value: 'active' },
              { label: 'Suspendido', value: 'suspended' },
            ]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-44"
          />
        </div>

        {loading && <LoadingState message="Cargando usuarios..." />}
        {error && <ErrorState message={error} onRetry={fetchUsers} />}
        {!loading && !error && users.length === 0 && (
          <EmptyState icon="👥" title="No hay usuarios" message="Prueba ajustando los filtros de búsqueda" />
        )}

        {!loading && !error && users.length > 0 && (
          <Table headers={['Usuario', 'Email', 'Rol', 'Estado', 'Coins', 'Diamonds', 'Acciones']}>
            {users.map((user: any) => (
              <tr key={user.id} className="group hover:bg-gray-900/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-xs font-bold text-white">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user.displayName || '—'}</p>
                      <p className="text-xs text-gray-500">@{user.username || 'N/A'}</p>
                    </div>
                    {user.isVerified && <span className="text-blue-400 text-xs" title="Verificado">✓</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">{user.email || '—'}</td>
                <td className="px-6 py-4">{getRoleBadge(user.role || 'user')}</td>
                <td className="px-6 py-4">{getStatusBadge(user.status || 'active')}</td>
                <td className="px-6 py-4 text-sm font-mono text-amber-400">{(user.coins ?? 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-mono text-blue-400">{(user.diamonds ?? 0).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link href={`/users/${user.id}`}>
                      <Button variant="ghost" size="sm">Ver</Button>
                    </Link>
                    {user.status !== 'suspended' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={actionLoading === `suspend-${user.id}`}
                        onClick={() => handleAction('suspend', user.id)}
                      >
                        Suspender
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        size="sm"
                        isLoading={actionLoading === `reactivate-${user.id}`}
                        onClick={() => handleAction('reactivate', user.id)}
                      >
                        Reactivar
                      </Button>
                    )}
                    {!user.isVerified ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={actionLoading === `verify-${user.id}`}
                        onClick={() => handleAction('verify', user.id)}
                      >
                        Verificar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={actionLoading === `unverify-${user.id}`}
                        onClick={() => handleAction('unverify', user.id)}
                      >
                        Quitar ✓
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </AdminLayout>
  );
}
