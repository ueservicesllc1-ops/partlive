import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const test = async () => {
  // Initialize firebase-admin locally
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Replace \n characters in the private key
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
  }

  const uid = 'test-livekit-user-123';
  console.log('Generating Firebase Custom Token for UID:', uid);
  const customToken = await admin.auth().createCustomToken(uid);

  // Exchange custom token for ID token
  const webApiKey = 'AIzaSyDY2HbWd8ZYlesnntmqQi83f13oxV0mdeQ';
  console.log('Exchanging Custom Token for ID Token...');
  const exchangeRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${webApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );

  if (!exchangeRes.ok) {
    const err = await exchangeRes.text();
    throw new Error('Failed to exchange custom token: ' + err);
  }

  const exchangeData = (await exchangeRes.json()) as any;
  const idToken = exchangeData.idToken;
  console.log('Got Firebase ID Token successfully!');

  // Now, create a test room in Firestore so we can get a LiveKit token for it.
  const db = admin.firestore();
  const roomId = 'test-voice-room-livekit';
  
  console.log('Ensuring test room and membership exist in Firestore...');
  await db.collection('rooms').doc(roomId).set({
    name: 'Test Voice Room',
    status: 'active',
    maxMics: 8,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('rooms').doc(roomId).collection('members').doc(uid).set({
    userId: uid,
    role: 'speaker', // speaker role allows publishing
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    isMuted: false,
  });

  // Call the production API to get the token!
  const prodUrl = 'https://partlive-production.up.railway.app/api/livekit/token';
  console.log('Requesting LiveKit token from production server:', prodUrl);

  const tokenRes = await fetch(prodUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ roomId }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('❌ Failed to get token from production server:', err);
    return;
  }

  const tokenData = (await tokenRes.json()) as any;
  console.log('✅ Received response from production server:');
  console.log('Returned URL:', tokenData.url);
  console.log('Returned Identity:', tokenData.identity);
  console.log('Returned roomName:', tokenData.roomName);
  console.log('Returned canPublish:', tokenData.canPublish);
  console.log('Returned token (truncated):', tokenData.token ? tokenData.token.substring(0, 50) + '...' : 'NONE');

  if (tokenData.token) {
    // Decode JWT token
    const parts = tokenData.token.split('.');
    if (parts.length === 3) {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('\n--- Decoded LiveKit Token Details ---');
      console.log('Header (shows Key ID):', header);
      console.log('Payload:', payload);
      
      const isDevKey = header.alg === 'HS256' && payload.iss === 'devkey';
      if (isDevKey) {
        console.log('\n⚠️ WARNING: The production server is using "devkey" as the LiveKit API key! This means it does not have the correct environment variables (LIVEKIT_API_KEY / LIVEKIT_API_SECRET) set in Railway!');
      } else {
        console.log('\n🎉 Production server is using a custom LiveKit API key (iss):', payload.iss);
      }
    }
  }
};

test()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  });
