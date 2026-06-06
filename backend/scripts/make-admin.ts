/**
 * Script: make-admin.ts
 * Uso: npx ts-node scripts/make-admin.ts <email-o-uid>
 * Ejemplo: npx ts-node scripts/make-admin.ts admin@partylive.app
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

const target = process.argv[2];

if (!target) {
  console.error('❌ Uso: npx ts-node scripts/make-admin.ts <email-o-uid>');
  process.exit(1);
}

async function makeAdmin() {
  let uid = target;

  // Si parece un email, buscar el UID
  if (target.includes('@')) {
    try {
      const user = await auth.getUserByEmail(target);
      uid = user.uid;
      console.log(`✅ Usuario encontrado: ${user.displayName || user.email} (uid: ${uid})`);
    } catch (err) {
      console.error(`❌ No se encontró usuario con email: ${target}`);
      process.exit(1);
    }
  }

  // Actualizar role en Firestore
  try {
    await db.collection('users').doc(uid).update({ role: 'admin' });
    console.log(`🎉 ¡Listo! El usuario ${uid} ahora es ADMIN.`);
    console.log(`   Puede entrar al panel: http://localhost:3001/login`);
    process.exit(0);
  } catch (err: any) {
    // Si el documento no existe, crearlo
    if (err.code === 5) {
      await db.collection('users').doc(uid).set({ role: 'admin', uid }, { merge: true });
      console.log(`🎉 ¡Listo! Se creó/actualizó el usuario ${uid} como ADMIN.`);
      process.exit(0);
    }
    console.error('❌ Error al actualizar Firestore:', err.message);
    process.exit(1);
  }
}

makeAdmin();
