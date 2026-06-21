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

const sessionId = '9BzTOhNoIJqx62WE9GHH';

db.collection('userSessions').doc(sessionId).get()
  .then(async (doc) => {
    if (!doc.exists) {
      console.log('Session not found in userSessions collection.');
      // Let's list all sessions
      const snap = await db.collection('userSessions').limit(5).get();
      console.log('Available sessions count:', snap.size);
      snap.forEach(s => console.log(s.id, s.data()));
      process.exit(0);
    }
    const sessionData = doc.data();
    console.log('--- SESSION DATA ---', sessionData);
    
    const userId = sessionData.userId;
    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        console.log('--- USER PROFILE ---', userDoc.data());
      } else {
        console.log('User profile not found in users collection for ID:', userId);
      }
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error running check:', err);
    process.exit(1);
  });
