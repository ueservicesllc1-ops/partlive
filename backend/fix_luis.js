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

const userId = 'DHCkuoejilVBRfwlpE4FmDQkrej1';
const username = 'ueservicesllc1425';

async function run() {
  try {
    console.log('Starting migration to fix Luis profile...');
    
    // 1. Update user profile to be completed
    await db.collection('users').doc(userId).update({
      profileCompleted: true,
      username: username,
      usernameLowercase: username.toLowerCase(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Updated user profile in users collection successfully.');

    // 2. Reserve username in usernames collection
    await db.collection('usernames').doc(username.toLowerCase()).set({
      uid: userId,
      username: username,
      createdAt: new Date().toISOString(),
    });
    console.log('Reserved username in usernames collection successfully.');
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

run();
