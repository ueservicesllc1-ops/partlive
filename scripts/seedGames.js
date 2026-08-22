/**
 * seedGames.js
 * Crea (o actualiza) los 4 juegos activos en la colección "games" de Firestore.
 *
 * Uso:
 *   node scripts/seedGames.js
 *
 * Requiere:
 *   - firebase-admin instalado (npm install firebase-admin --save-dev)
 *   - La variable de entorno GOOGLE_APPLICATION_CREDENTIALS apuntando
 *     al archivo service-account.json, O modifica serviceAccountPath abajo.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');

// ─── Configuración ────────────────────────────────────────────────────────────
const serviceAccountPath = path.join(__dirname, '..', 'party-79ae1-firebase-adminsdk-fbsvc-14cd2f619c.json');
const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();


// ─── Datos de los juegos ──────────────────────────────────────────────────────
const GAMES = [
  {
    id: 'trivia',
    slug: 'trivia',
    title: 'Trivia Live',
    description: 'Responde rápido y demuestra cuánto sabes.',
    icon: '💡',
    color: '#8A4FFF',
    category: 'Trivia',
    status: 'active',
    isActive: true,
    minPlayers: 1,
    maxPlayers: 8,
    playersOnline: 4200,
    estimatedMinutes: 5,
    rewardCoinsMin: 20,
    rewardCoinsMax: 80,
    rewardXp: 50,
  },
  {
    id: 'rock_paper_scissors',
    slug: 'rock_paper_scissors',
    title: 'Piedra, Papel o Tijeras',
    description: 'El clásico duelo de 3 rondas contra otros jugadores.',
    icon: '✂️',
    color: '#00E5FF',
    category: 'Acción',
    status: 'active',
    isActive: true,
    minPlayers: 1,
    maxPlayers: 2,
    playersOnline: 2800,
    estimatedMinutes: 3,
    rewardCoinsMin: 15,
    rewardCoinsMax: 60,
    rewardXp: 40,
  },
  {
    id: 'dice',
    slug: 'dice',
    title: 'Dados Locos',
    description: 'Lanza dados y el mayor puntaje gana. ¡Pura suerte!',
    icon: '🎲',
    color: '#FF3366',
    category: 'Casual',
    status: 'active',
    isActive: true,
    minPlayers: 1,
    maxPlayers: 4,
    playersOnline: 3100,
    estimatedMinutes: 4,
    rewardCoinsMin: 10,
    rewardCoinsMax: 50,
    rewardXp: 35,
  },
  {
    id: 'bingo',
    slug: 'bingo',
    title: 'Bingo Loco',
    description: '¡Canta Bingo antes que nadie y gana monedas!',
    icon: '🔢',
    color: '#00E676',
    category: 'Social',
    status: 'active',
    isActive: true,
    minPlayers: 1,
    maxPlayers: 10,
    playersOnline: 6700,
    estimatedMinutes: 8,
    rewardCoinsMin: 10,
    rewardCoinsMax: 120,
    rewardXp: 60,
  },
  {
    id: 'draw_guess',
    slug: 'draw_guess',
    title: 'Draw & Guess',
    description: 'Dibuja rápido y adivina el dibujo de los demás.',
    icon: '🎨',
    color: '#FFC400',
    category: 'Social',
    status: 'coming_soon',
    isActive: false,
    minPlayers: 2,
    maxPlayers: 8,
    playersOnline: 0,
    estimatedMinutes: 10,
    rewardCoinsMin: 0,
    rewardCoinsMax: 0,
    rewardXp: 0,
  },
  {
    id: 'ludo',
    slug: 'ludo',
    title: 'Ludo Party',
    description: 'El clásico ludo con amigos en tiempo real.',
    icon: '🎯',
    color: '#FF5722',
    category: 'Casual',
    status: 'coming_soon',
    isActive: false,
    minPlayers: 2,
    maxPlayers: 4,
    playersOnline: 0,
    estimatedMinutes: 20,
    rewardCoinsMin: 0,
    rewardCoinsMax: 0,
    rewardXp: 0,
  },
  {
    id: 'domino',
    slug: 'domino',
    title: 'Dominó Pro',
    description: 'Bloquea a tus oponentes y domina la mesa.',
    icon: '🀄',
    color: '#9C27B0',
    category: 'Casual',
    status: 'coming_soon',
    isActive: false,
    minPlayers: 2,
    maxPlayers: 4,
    playersOnline: 0,
    estimatedMinutes: 15,
    rewardCoinsMin: 0,
    rewardCoinsMax: 0,
    rewardXp: 0,
  },
];

// ─── Seeder ───────────────────────────────────────────────────────────────────
async function seedGames() {
  console.log('🎮 Iniciando seeder de juegos...\n');
  const batch = db.batch();
  const gamesCol = db.collection('games');

  for (const game of GAMES) {
    const ref = gamesCol.doc(game.id);
    batch.set(
      ref,
      {
        ...game,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }, // No sobreescribir datos extra que pueda haber
    );
    console.log(`  ✅ ${game.status === 'active' ? '🟢' : '🔒'} ${game.title} (${game.id})`);
  }

  await batch.commit();
  console.log('\n✨ Seeder completado. Los juegos ya están en Firestore.');
  process.exit(0);
}

seedGames().catch(err => {
  console.error('❌ Error en el seeder:', err);
  process.exit(1);
});
