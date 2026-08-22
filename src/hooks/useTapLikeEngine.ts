import { useRef, useCallback, useEffect } from 'react';

const BATCH_FLUSH_MS = 2000; // Flush every 2 seconds
const MAX_BATCH_TAPS = 50;   // Safety cap per flush

interface UseTapLikeEngineOptions {
  liveId: string;
  onAnimateTap: (x: number, y: number) => void;
}

export const useTapLikeEngine = ({ liveId, onAnimateTap }: UseTapLikeEngineOptions) => {
  const pendingTaps = useRef(0);
  const flushTimer = useRef<NodeJS.Timeout | null>(null);

  const flushToServer = useCallback(async () => {
    if (pendingTaps.current <= 0) return;

    const count = Math.min(pendingTaps.current, MAX_BATCH_TAPS);
    pendingTaps.current = 0;

    try {
      const { apiFetch } = await import('../services/api/apiClient');
      await apiFetch(`/lives/${liveId}/tap-like/batch`, {
        method: 'POST',
        body: JSON.stringify({ tapCount: count }),
      });
    } catch (err) {
      // Silently discard failed batch — local animation already showed
      console.warn('[TapLike] Batch sync failed silently:', err);
    }
  }, [liveId]);

  // Schedule periodic flush
  useEffect(() => {
    flushTimer.current = setInterval(flushToServer, BATCH_FLUSH_MS);
    return () => {
      if (flushTimer.current) clearInterval(flushTimer.current);
      // Final flush on unmount
      flushToServer();
    };
  }, [flushToServer]);

  const handleTap = useCallback((x: number, y: number) => {
    // 1. Instant local animation (no network wait)
    onAnimateTap(x, y);
    // 2. Queue for batch sync
    pendingTaps.current += 1;
  }, [onAnimateTap]);

  return { handleTap };
};
