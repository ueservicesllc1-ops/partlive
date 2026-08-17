import { db } from '../../src/config/firebase';

async function run() {
  console.log('--- USERNAME DIAGNOSTIC ---');
  const target = 'kkkk';
  const doc = await db.collection('usernames').doc(target).get();
  console.log(`Doc for "${target}": exists = ${doc.exists}`);
  if (doc.exists) {
    console.log('Data:', doc.data());
  }

  console.log('\n--- LISTING FIRST 10 USERNAMES ---');
  const snap = await db.collection('usernames').limit(10).get();
  console.log(`Total usernames found: ${snap.size}`);
  snap.forEach(d => {
    console.log(`- ${d.id}:`, d.data());
  });

  console.log('\n--- LISTING FIRST 10 USERS ---');
  const userSnap = await db.collection('users').limit(10).get();
  console.log(`Total users found: ${userSnap.size}`);
  userSnap.forEach(d => {
    console.log(`- ${d.id}: username=${d.data().username}, profileCompleted=${d.data().profileCompleted}`);
  });
}

run().catch(console.error);
