/**
 * seedGamesRest.js
 * Crea los documentos de juegos en Firestore usando la REST API.
 *
 * NOTA: Esto funciona solo si las Firestore Security Rules permiten escritura
 * desde el servidor, o si el proyecto está en modo de desarrollo.
 *
 * Uso: node scripts/seedGamesRest.js
 *
 * Si las reglas de Firestore requieren autenticación, usa seedGames.js
 * con un service-account.json descargado desde:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 */

const https = require('https');

const PROJECT_ID = 'party-79ae1';
const API_KEY = 'AIzaSyDY2HbWd8ZYlesnntmqQi83f13oxV0mdeQ';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

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
    minPlayers: 1,
    maxPlayers: 8,
    playersOnline: 4200,
    estimatedMinutes: 5,
    rewardCoinsMin: 20,
    rewardCoinsMax: 80,
    rewardXp: 120,
    isActive: true,
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
    minPlayers: 1,
    maxPlayers: 2,
    playersOnline: 2800,
    estimatedMinutes: 3,
    rewardCoinsMin: 15,
    rewardCoinsMax: 60,
    rewardXp: 80,
    isActive: true,
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
    minPlayers: 1,
    maxPlayers: 4,
    playersOnline: 3100,
    estimatedMinutes: 4,
    rewardCoinsMin: 10,
    rewardCoinsMax: 50,
    rewardXp: 60,
    isActive: true,
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
    minPlayers: 1,
    maxPlayers: 10,
    playersOnline: 6700,
    estimatedMinutes: 8,
    rewardCoinsMin: 10,
    rewardCoinsMax: 120,
    rewardXp: 150,
    isActive: true,
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
    minPlayers: 2,
    maxPlayers: 8,
    playersOnline: 0,
    estimatedMinutes: 10,
    rewardCoinsMin: 0,
    rewardCoinsMax: 0,
    rewardXp: 0,
    isActive: false,
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
    minPlayers: 2,
    maxPlayers: 4,
    playersOnline: 0,
    estimatedMinutes: 20,
    rewardCoinsMin: 0,
    rewardCoinsMax: 0,
    rewardXp: 0,
    isActive: false,
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
    minPlayers: 2,
    maxPlayers: 4,
    playersOnline: 0,
    estimatedMinutes: 15,
    rewardCoinsMin: 0,
    rewardCoinsMax: 0,
    rewardXp: 0,
    isActive: false,
  },
];

// Convert JS value to Firestore REST value format
function toFirestoreValue(val) {
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number' && Number.isInteger(val)) return { integerValue: String(val) };
  if (typeof val === 'number') return { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (val === null) return { nullValue: null };
  return { stringValue: String(val) };
}

function toFirestoreDoc(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return { fields };
}

function patchDocument(gameId, doc) {
  return new Promise((resolve, reject) => {
    const fieldPaths = Object.keys(doc.fields).map(f => `updateMask.fieldPaths=${f}`).join('&');
    const path = `/games/${gameId}?${fieldPaths}&key=${API_KEY}`;
    const body = JSON.stringify(doc);

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents${path}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function seedGames() {
  console.log('🎮 Iniciando seeder de juegos en Firestore (REST API)...\n');

  for (const game of GAMES) {
    const { id, ...gameData } = game;
    const doc = toFirestoreDoc(gameData);
    try {
      await patchDocument(id, doc);
      console.log(`  ✅ ${game.status === 'active' ? '🟢' : '🔒'} ${game.title} (${id})`);
    } catch (err) {
      console.error(`  ❌ Error creando ${id}:`, err.message);
    }
  }

  console.log('\n✨ Seeder completado.');
}

seedGames();
