const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});

const db = admin.firestore();

async function run() {
  try {
    console.log('--- FETCHING RECENT USER SESSIONS ---');
    const sessionsSnap = await db.collection('userSessions')
      .orderBy('startedAt', 'desc')
      .limit(10)
      .get();
      
    console.log('Sessions count:', sessionsSnap.size);
    for (const doc of sessionsSnap.docs) {
      const data = doc.data();
      console.log(`\nSession ID: "${doc.id}"`);
      console.log(`- User ID: "${data.userId}"`);
      console.log(`- Device ID: "${data.deviceId}"`);
      console.log(`- Platform: "${data.platform}"`);
      console.log(`- Country: "${data.country}"`);
      console.log(`- Status: "${data.status}"`);
      console.log(`- Started At:`, data.startedAt?.toDate());
      console.log(`- Last Heartbeat At:`, data.lastHeartbeatAt?.toDate());
      
      if (data.userId) {
        const userDoc = await db.collection('users').doc(data.userId).get();
        if (userDoc.exists) {
          console.log(`- User Profile:`, JSON.stringify(userDoc.data(), null, 2));
        } else {
          console.log(`- User Profile: NOT FOUND`);
        }
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Error running check:', error);
    process.exit(1);
  }
}

run();
