import { RoomServiceClient } from 'livekit-server-sdk';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const test = async () => {
  const host = process.env.LIVEKIT_WS_URL || 'ws://localhost:7880';
  const httpHost = host.replace('ws://', 'http://').replace('wss://', 'https://');
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  console.log('Host URL (WebSocket):', host);
  console.log('Host URL (HTTP):', httpHost);
  console.log('API Key:', apiKey ? 'FOUND (length ' + apiKey.length + ')' : 'MISSING');
  console.log('API Secret:', apiSecret ? 'FOUND (length ' + apiSecret.length + ')' : 'MISSING');

  const client = new RoomServiceClient(
    httpHost,
    apiKey,
    apiSecret
  );

  try {
    const rooms = await client.listRooms();
    console.log('✅ Successfully connected to LiveKit Cloud! Rooms:', rooms);
  } catch (error) {
    console.error('❌ Error listing rooms from LiveKit Cloud:', error);
  }
};

test();
