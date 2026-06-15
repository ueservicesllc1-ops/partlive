import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { listenToUnreadPrivateMessagesCount } from '../services/firebase/firestore/privateChatService';

export function useUnreadPrivateMessagesCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid || user.uid === 'guest_user') {
      setUnreadCount(0);
      return;
    }

    const unsubscribe = listenToUnreadPrivateMessagesCount(user.uid, count => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return unreadCount;
}
