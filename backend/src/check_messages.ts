import { db } from './config/firebase';

async function run() {
  console.log('--- DIAGNOSTIC START ---');
  
  // 1. Query active lives
  console.log('\n--- ACTIVE LIVES ---');
  const livesSnap = await db.collection('lives').where('status', '==', 'live').get();
  console.log(`Found ${livesSnap.size} active lives.`);
  for (const doc of livesSnap.docs) {
    const data = doc.data();
    console.log(`Live: ID=${doc.id}, Title="${data.title}", Host="${data.hostName}"`);
    
    // Query recent messages
    const msgsSnap = await doc.ref.collection('messages').orderBy('createdAt', 'desc').limit(5).get();
    console.log(`  Recent Messages (${msgsSnap.size}):`);
    msgsSnap.docs.forEach(mDoc => {
      const mData = mDoc.data();
      const time = mData.createdAt ? (mData.createdAt.toDate ? mData.createdAt.toDate().toISOString() : mData.createdAt) : 'N/A';
      console.log(`    - [${time}] senderName="${mData.senderName}", text="${mData.text}", status="${mData.status}", type="${mData.type}"`);
    });
  }

  // 2. Query active voice rooms
  console.log('\n--- ACTIVE VOICE ROOMS ---');
  const roomsSnap = await db.collection('rooms').where('status', '==', 'active').get();
  console.log(`Found ${roomsSnap.size} active rooms.`);
  for (const doc of roomsSnap.docs) {
    const data = doc.data();
    console.log(`Room: ID=${doc.id}, Title="${data.title}", Owner="${data.ownerName}"`);
    
    // Query recent messages
    const msgsSnap = await doc.ref.collection('messages').orderBy('createdAt', 'desc').limit(5).get();
    console.log(`  Recent Messages (${msgsSnap.size}):`);
    msgsSnap.docs.forEach(mDoc => {
      const mData = mDoc.data();
      const time = mData.createdAt ? (mData.createdAt.toDate ? mData.createdAt.toDate().toISOString() : mData.createdAt) : 'N/A';
      console.log(`    - [${time}] senderName="${mData.senderName}", text="${mData.text}", status="${mData.status}", type="${mData.type}"`);
    });
  }

  console.log('\n--- DIAGNOSTIC END ---');
}

run().catch(console.error);
