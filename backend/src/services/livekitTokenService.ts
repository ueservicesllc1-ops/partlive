import { AccessToken } from 'livekit-server-sdk';

interface LiveKitTokenParams {
  identity: string;
  name: string;
  roomName: string;
  canPublish: boolean;
  canSubscribe: boolean;
  canPublishData: boolean;
  metadata?: Record<string, any>;
}

export const createLiveKitRoomToken = async (params: LiveKitTokenParams): Promise<string> => {
  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'devsecret';
  const expireSeconds = parseInt(process.env.LIVEKIT_TOKEN_EXPIRE_SECONDS || '3600', 10);

  const at = new AccessToken(apiKey, apiSecret, {
    identity: params.identity,
    name: params.name,
    ttl: expireSeconds,
    metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
  });

  at.addGrant({
    roomJoin: true,
    room: params.roomName,
    canPublish: params.canPublish,
    canSubscribe: params.canSubscribe,
    canPublishData: params.canPublishData,
  });

  return at.toJwt();
};
