'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingState, ErrorState, ConfirmDialog } from '@/components/ui/Extras';
import { api } from '@/services/apiClient';
import { useAdminAuth } from '@/components/auth/AdminAuthProvider';
import { moderationAdminApi } from '@/services/moderationAdminApi';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin } = useAdminAuth();
  const userId = params.userId as string;

  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modals
  const [walletModal, setWalletModal] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  
  // Moderation Modals
  const [warnModal, setWarnModal] = useState(false);
  const [suspendModal, setSuspendModal] = useState(false);
  const [banModal, setBanModal] = useState(false);
  const [unbanConfirm, setUnbanConfirm] = useState(false);
  const [lockWalletConfirm, setLockWalletConfirm] = useState(false);
  const [unlockWalletConfirm, setUnlockWalletConfirm] = useState(false);

  // Forms
  const [walletForm, setWalletForm] = useState({ currencyType: 'coins', amount: '', direction: 'credit', reason: '' });
  const [newRole, setNewRole] = useState('user');
  
  const [modReason, setModReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('24');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userSnap, walletSnap] = await Promise.all([
        getDoc(doc(db, 'users', userId)),
        getDoc(doc(db, 'wallets', userId)),
      ]);

      if (!userSnap.exists()) { setError('Usuario no encontrado'); setLoading(false); return; }
      setUser({ id: userSnap.id, ...userSnap.data() });
      if (walletSnap.exists()) setWallet({ id: walletSnap.id, ...walletSnap.data() });

      // Fetch recent transactions
      const txSnap = await getDocs(query(
        collection(db, 'walletTransactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      ));
      setTransactions(txSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (userId) fetchData(); }, [userId]);

  // Moderation handlers
  const handleWarn = async () => {
    if (!modReason.trim()) return alert('Por favor ingresa un motivo');
    setActionLoading('warn');
    try {
      await moderationAdminApi.warnUser(userId, modReason);
      setWarnModal(false);
      setModReason('');
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleSuspend = async () => {
    if (!modReason.trim()) return alert('Por favor ingresa un motivo');
    setActionLoading('suspend');
    try {
      await moderationAdminApi.suspendUser(userId, modReason, parseInt(suspendDuration) || 24);
      setSuspendModal(false);
      setModReason('');
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleBan = async () => {
    if (!modReason.trim()) return alert('Por favor ingresa un motivo');
    setActionLoading('ban');
    try {
      await moderationAdminApi.banUser(userId, modReason);
      setBanModal(false);
      setModReason('');
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleUnban = async () => {
    setActionLoading('unban');
    try {
      // If user status was suspended, calling unsuspend clears it. Otherwise call unban.
      if (user.status === 'suspended') {
        await moderationAdminApi.unsuspendUser(userId, 'Removido por administración');
      } else {
        await moderationAdminApi.unbanUser(userId, 'Removido por administración');
      }
      setUnbanConfirm(false);
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleLockWallet = async () => {
    if (!modReason.trim()) return alert('Por favor ingresa un motivo');
    setActionLoading('lock-wallet');
    try {
      await moderationAdminApi.lockWallet(userId, modReason);
      setLockWalletConfirm(false);
      setModReason('');
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleUnlockWallet = async () => {
    setActionLoading('unlock-wallet');
    try {
      await moderationAdminApi.unlockWallet(userId, 'Desbloqueado por administración');
      setUnlockWalletConfirm(false);
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  // Wallet adjust
  const handleWalletAdjustment = async () => {
    setActionLoading('wallet');
    try {
      await api.post(`/api/admin/users/${userId}/wallet-adjustment`, {
        currencyType: walletForm.currencyType,
        amount: Number(walletForm.amount),
        direction: walletForm.direction,
        reason: walletForm.reason,
      });
      setWalletModal(false);
      setWalletForm({ currencyType: 'coins', amount: '', direction: 'credit', reason: '' });
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleRoleChange = async () => {
    setActionLoading('role');
    try {
      await api.post(`/api/admin/users/${userId}/role`, { role: newRole });
      setRoleModal(false);
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  if (loading) return <AdminLayout title="Detalle Usuario"><LoadingState /></AdminLayout>;
  if (error) return <AdminLayout title="Error"><ErrorState message={error} onRetry={fetchData} /></AdminLayout>;
  if (!user) return null;

  return (
    <AdminLayout title={`Usuario: ${user.displayName || user.email}`}>
      <div className="space-y-6 max-w-5xl">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => router.push('/users')}>← Volver</Button>

        {/* User Header */}
        <Card className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center text-2xl font-black text-white shadow-lg">
            {(user.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white">{user.displayName || '—'}</h2>
              {user.isVerified && <Badge variant="info">✓ Verificado</Badge>}
              <Badge variant={user.status === 'banned' ? 'danger' : user.status === 'suspended' ? 'warning' : 'success'}>
                {user.status || 'active'}
              </Badge>
              <Badge variant={user.role === 'admin' ? 'violet' : user.role === 'host' ? 'warning' : 'muted'}>{user.role || 'user'}</Badge>
            </div>
            <p className="text-sm text-gray-400 mt-1">@{user.username || 'N/A'} • {user.email}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setWalletModal(true)}>💰 Ajustar Wallet</Button>
            {isAdmin && (
              <Button variant="secondary" size="sm" onClick={() => { setNewRole(user.role || 'user'); setRoleModal(true); }}>
                🔑 Cambiar Rol
              </Button>
            )}
          </div>
        </Card>

        {/* Moderation Action Panel */}
        <Card className="border border-gray-800 bg-gray-900/40">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Panel de Moderación y Sanciones</h3>
          <div className="flex flex-wrap gap-3">
            {user.status === 'active' || user.status === 'warning' ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => setWarnModal(true)}>
                  ⚠️ Advertir Usuario
                </Button>
                <Button variant="warning" size="sm" onClick={() => setSuspendModal(true)}>
                  🚫 Suspender Cuenta
                </Button>
                <Button variant="danger" size="sm" onClick={() => setBanModal(true)}>
                  ❌ Banear Cuenta
                </Button>
              </>
            ) : (
              <Button variant="success" size="sm" onClick={() => setUnbanConfirm(true)}>
                ✅ Reactivar Cuenta / Quitar Bloqueo
              </Button>
            )}

            {wallet?.status !== 'locked' ? (
              <Button variant="danger" size="sm" onClick={() => setLockWalletConfirm(true)}>
                🔒 Bloquear Wallet
              </Button>
            ) : (
              <Button variant="success" size="sm" onClick={() => setUnlockWalletConfirm(true)}>
                🔓 Desbloquear Wallet
              </Button>
            )}
          </div>
        </Card>

        {/* Wallet stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Coins', value: wallet?.coins ?? 0, icon: '🪙', color: 'text-amber-400' },
            { label: 'Diamonds', value: wallet?.diamonds ?? 0, icon: '💎', color: 'text-blue-400' },
            { label: 'Diamonds Bloqueados', value: wallet?.lockedDiamonds ?? 0, icon: '🔒', color: 'text-gray-400' },
          ].map(stat => (
            <Card key={stat.label} className="text-center">
              <p className="text-2xl">{stat.icon}</p>
              <p className={`mt-2 text-2xl font-black ${stat.color}`}>{stat.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Recent Transactions */}
        <Card>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Transacciones Recientes</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-600">No hay transacciones</p>
          ) : (
            <div className="divide-y divide-gray-800/60 space-y-0">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{tx.type}</p>
                    <p className="text-xs text-gray-500">{tx.description || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.direction === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.direction === 'credit' ? '+' : '-'}{tx.amount} {tx.currencyType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Wallet Adjustment Modal */}
      <Modal isOpen={walletModal} onClose={() => setWalletModal(false)} title="Ajuste Manual de Wallet">
        <div className="space-y-4">
          <Select
            label="Tipo de Moneda"
            options={[{ label: 'Coins', value: 'coins' }, { label: 'Diamonds', value: 'diamonds' }]}
            value={walletForm.currencyType}
            onChange={e => setWalletForm({ ...walletForm, currencyType: e.target.value })}
          />
          <Select
            label="Dirección"
            options={[{ label: 'Acreditar', value: 'credit' }, { label: 'Debitar', value: 'debit' }]}
            value={walletForm.direction}
            onChange={e => setWalletForm({ ...walletForm, direction: e.target.value })}
          />
          <Input
            label="Cantidad"
            type="number"
            placeholder="0"
            value={walletForm.amount}
            onChange={e => setWalletForm({ ...walletForm, amount: e.target.value })}
          />
          <Textarea
            label="Motivo"
            placeholder="Razón del ajuste..."
            value={walletForm.reason}
            onChange={e => setWalletForm({ ...walletForm, reason: e.target.value })}
            rows={2}
          />
          <Button variant="primary" className="w-full" onClick={handleWalletAdjustment} isLoading={actionLoading === 'wallet'}>
            Aplicar Ajuste
          </Button>
        </div>
      </Modal>

      {/* Role Change Modal */}
      <Modal isOpen={roleModal} onClose={() => setRoleModal(false)} title="Cambiar Rol del Usuario">
        <div className="space-y-4">
          <Select
            label="Nuevo Rol"
            options={[
              { label: 'Usuario', value: 'user' },
              { label: 'Host', value: 'host' },
              { label: 'Moderador', value: 'moderator' },
              { label: 'Admin', value: 'admin' },
            ]}
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
          />
          <Button variant="primary" className="w-full" onClick={handleRoleChange} isLoading={actionLoading === 'role'}>
            Guardar Cambio de Rol
          </Button>
        </div>
      </Modal>

      {/* Warn Modal */}
      <Modal isOpen={warnModal} onClose={() => setWarnModal(false)} title="Advertir Usuario">
        <div className="space-y-4">
          <Textarea
            label="Motivo de la advertencia"
            placeholder="Especifica el motivo..."
            value={modReason}
            onChange={e => setModReason(e.target.value)}
            rows={3}
          />
          <Button variant="primary" className="w-full" onClick={handleWarn} isLoading={actionLoading === 'warn'}>
            Enviar Advertencia
          </Button>
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal isOpen={suspendModal} onClose={() => setSuspendModal(false)} title="Suspender Cuenta">
        <div className="space-y-4">
          <Input
            label="Duración (en horas)"
            type="number"
            value={suspendDuration}
            onChange={e => setSuspendDuration(e.target.value)}
            min="1"
          />
          <Textarea
            label="Motivo de la suspensión"
            placeholder="Especifica el motivo..."
            value={modReason}
            onChange={e => setModReason(e.target.value)}
            rows={3}
          />
          <Button variant="warning" className="w-full" onClick={handleSuspend} isLoading={actionLoading === 'suspend'}>
            Confirmar Suspensión
          </Button>
        </div>
      </Modal>

      {/* Ban Modal */}
      <Modal isOpen={banModal} onClose={() => setBanModal(false)} title="Banear Cuenta">
        <div className="space-y-4">
          <Textarea
            label="Motivo del baneo permanente"
            placeholder="Especifica el motivo..."
            value={modReason}
            onChange={e => setModReason(e.target.value)}
            rows={3}
          />
          <Button variant="danger" className="w-full" onClick={handleBan} isLoading={actionLoading === 'ban'}>
            Confirmar Baneo Permanente
          </Button>
        </div>
      </Modal>

      {/* Wallet Lock Modal */}
      <Modal isOpen={lockWalletConfirm} onClose={() => setLockWalletConfirm(false)} title="Bloquear Wallet">
        <div className="space-y-4">
          <Textarea
            label="Motivo del bloqueo de wallet"
            placeholder="Especifica el motivo..."
            value={modReason}
            onChange={e => setModReason(e.target.value)}
            rows={3}
          />
          <Button variant="danger" className="w-full" onClick={handleLockWallet} isLoading={actionLoading === 'lock-wallet'}>
            Bloquear Wallet
          </Button>
        </div>
      </Modal>

      {/* Confirm Unban */}
      <ConfirmDialog
        isOpen={unbanConfirm}
        onClose={() => setUnbanConfirm(false)}
        onConfirm={handleUnban}
        title="Quitar Restricción de Cuenta"
        message={`¿Confirmas reactivar la cuenta de ${user.displayName || user.email}? El usuario recuperará su acceso activo.`}
        confirmLabel="Reactivar"
        variant="primary"
        isLoading={actionLoading === 'unban'}
      />

      {/* Confirm Wallet Unlock */}
      <ConfirmDialog
        isOpen={unlockWalletConfirm}
        onClose={() => setUnlockWalletConfirm(false)}
        onConfirm={handleUnlockWallet}
        title="Desbloquear Wallet"
        message={`¿Confirmas desbloquear la wallet del usuario ${user.displayName || user.email}? El usuario podrá volver a realizar compras y retiros.`}
        confirmLabel="Desbloquear"
        variant="primary"
        isLoading={actionLoading === 'unlock-wallet'}
      />
    </AdminLayout>
  );
}
