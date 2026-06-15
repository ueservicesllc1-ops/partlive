'use client';

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { db } from '@/lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  writeBatch,
  orderBy,
  runTransaction
} from 'firebase/firestore';

interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
}

interface SocialActivity {
  id: string;
  title: string;
  description: string;
  type: string;
  createdAt: any;
}

export default function UserSocialTab() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user doc
      const userSnap = await getDoc(doc(db, 'users', userId));
      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfile({
          uid: userSnap.id,
          displayName: data.displayName || data.username || 'Usuario',
          username: data.username || '',
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0,
          friendsCount: data.friendsCount || 0,
        });
      }

      // 2. Fetch social activities
      const activitiesSnap = await getDocs(
        query(
          collection(db, 'socialActivities'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        )
      );
      setActivities(
        activitiesSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            type: data.type || '',
            createdAt: data.createdAt,
          };
        })
      );
    } catch (err) {
      console.error('Error loading user social data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const handleRecalculateCounters = async () => {
    setRecalculating(true);
    try {
      const followersSnap = await getDocs(
        query(collection(db, 'follows'), where('followingId', '==', userId), where('status', '==', 'active'))
      );
      const followingSnap = await getDocs(
        query(collection(db, 'follows'), where('followerId', '==', userId), where('status', '==', 'active'))
      );

      // Friends query
      const friendsSnap = await getDocs(collection(db, 'friends'));
      const friendsCount = friendsSnap.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'active' && (data.userAId === userId || data.userBId === userId);
      }).length;

      await updateDoc(doc(db, 'users', userId), {
        followersCount: followersSnap.size,
        followingCount: followingSnap.size,
        friendsCount: friendsCount,
      });

      alert('Contadores recalculados exitosamente.');
      fetchData();
    } catch (err) {
      console.error('Failed to recalculate counters:', err);
      alert('Error al recalcular contadores.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta actividad?')) return;
    try {
      await deleteDoc(doc(db, 'socialActivities', id));
      fetchData();
    } catch (err) {
      console.error('Failed to delete activity:', err);
    }
  };

  return (
    <AdminLayout title="Social de Usuario">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="px-3 py-1.5 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded-lg text-sm transition"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-white">
            Social: {profile?.displayName} (@{profile?.username})
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando datos sociales...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: social stats card */}
            <div className="space-y-6">
              <Card>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Conexiones del Usuario
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-gray-800/40 pb-2">
                    <span className="text-gray-500">Siguiendo:</span>
                    <span className="text-white font-bold">{profile?.followingCount}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800/40 pb-2">
                    <span className="text-gray-500">Seguidores:</span>
                    <span className="text-white font-bold">{profile?.followersCount}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-gray-500">Amigos mutuos:</span>
                    <span className="text-accent font-bold">{profile?.friendsCount}</span>
                  </div>
                </div>

                <button
                  onClick={handleRecalculateCounters}
                  disabled={recalculating}
                  className="mt-6 w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition disabled:bg-violet-800"
                >
                  {recalculating ? 'Calculando...' : '⚙️ Recalcular Contadores'}
                </button>
              </Card>
            </div>

            {/* Right: recent social activities feed */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <h2 className="text-lg font-bold text-white mb-4">📢 Historial de Actividad del Usuario</h2>
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">El usuario no tiene actividades registradas.</p>
                  ) : (
                    activities.map(act => (
                      <div
                        key={act.id}
                        className="flex justify-between items-start p-4 bg-gray-950 border border-gray-800 rounded-xl"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] bg-violet-600/10 text-violet-400 font-bold px-2 py-0.5 rounded-full uppercase">
                            {act.type}
                          </span>
                          <p className="text-sm font-bold text-white mt-1">{act.title}</p>
                          <p className="text-xs text-gray-400">{act.description}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteActivity(act.id)}
                          className="text-xs text-red-500 hover:text-red-400 font-bold ml-4"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
