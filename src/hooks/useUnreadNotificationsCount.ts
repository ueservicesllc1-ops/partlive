import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { listenToUnreadNotificationsCount } from '../services/firebase/firestore/notificationsService';

export function useUnreadNotificationsCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = listenToUnreadNotificationsCount(user.uid, (count) => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return unreadCount;
}
