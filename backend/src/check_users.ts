import { db } from './config/firebase';

async function run() {
  console.log('--- USER DIAGNOSTIC ---');
  const snap = await db.collection('users').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    console.log(`User ID: ${doc.id}`);
    console.log(`  displayName: ${data.displayName}`);
    console.log(`  username: ${data.username}`);
    console.log(`  photoURL: ${data.photoURL}`);
    console.log(`  email: ${data.email}`);
  }
}

run().catch(console.error);
