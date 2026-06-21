const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (!privateKey) {
  console.error('FIREBASE_PRIVATE_KEY is missing in env!');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});

const db = admin.firestore();

db.collection('usernames')
  .limit(30)
  .get()
  .then((snap) => {
    console.log('--- USERNAME DOCUMENTS ---');
    console.log('Count:', snap.size);
    snap.forEach((doc) => {
      console.log(`- ID: "${doc.id}" -> Data:`, doc.data());
    });
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error fetching usernames:', err);
    process.exit(1);
  });
