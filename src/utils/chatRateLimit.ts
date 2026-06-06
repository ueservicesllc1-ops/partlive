// Memory rate limiter for chat messaging inside rooms
interface UserRateLimitState {
  timestamps: number[];
  emojiTimestamps: number[];
}

const rateLimitMap = new Map<string, UserRateLimitState>();

export const checkChatRateLimit = (userId: string, isEmoji = false): { allowed: boolean; waitSeconds?: number } => {
  const now = Date.now();
  
  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, { timestamps: [], emojiTimestamps: [] });
  }

  const userState = rateLimitMap.get(userId)!;

  if (isEmoji) {
    // Limit: Max 2 emojis per 5 seconds
    userState.emojiTimestamps = userState.emojiTimestamps.filter(t => now - t < 5000);
    if (userState.emojiTimestamps.length >= 2) {
      const oldest = userState.emojiTimestamps[0];
      const wait = Math.ceil((5000 - (now - oldest)) / 1000);
      return { allowed: false, waitSeconds: wait };
    }
    userState.emojiTimestamps.push(now);
  } else {
    // Limit: Max 5 text messages per 10 seconds
    userState.timestamps = userState.timestamps.filter(t => now - t < 10000);
    if (userState.timestamps.length >= 5) {
      const oldest = userState.timestamps[0];
      const wait = Math.ceil((10000 - (now - oldest)) / 1000);
      return { allowed: false, waitSeconds: wait };
    }
    userState.timestamps.push(now);
  }

  return { allowed: true };
};
