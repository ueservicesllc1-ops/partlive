import firestore from '@react-native-firebase/firestore';
import { FirestoreCollections } from '../../../constants/firestoreCollections';
import { nowServerTimestamp } from '../../../utils/firestoreDates';
import { buildKaraokeSongKeywords } from '../../../utils/karaokeSearch';

const GIFTS = [
  { id: 'gift_rose', name: 'Rose', priceCoins: 10, valueDiamonds: 5, rarity: 'common', iconUrl: '🌹' },
  { id: 'gift_heart', name: 'Heart', priceCoins: 50, valueDiamonds: 25, rarity: 'common', iconUrl: '❤️' },
  { id: 'gift_crown', name: 'Crown', priceCoins: 500, valueDiamonds: 250, rarity: 'rare', iconUrl: '👑' },
  { id: 'gift_car', name: 'Sports Car', priceCoins: 5000, valueDiamonds: 2500, rarity: 'epic', iconUrl: '🏎️' },
  { id: 'gift_castle', name: 'Castle', priceCoins: 20000, valueDiamonds: 10000, rarity: 'legendary', iconUrl: '🏰' },
  { id: 'gift_dragon', name: 'Dragon', priceCoins: 50000, valueDiamonds: 25000, rarity: 'legendary', iconUrl: '🐉' },
];

const GAMES = [
  { id: 'game_ludo', title: 'Ludo Party', slug: 'ludo-party', category: 'board', minPlayers: 2, maxPlayers: 4, iconUrl: '🎲' },
  { id: 'game_domino', title: 'Domino Pro', slug: 'domino-pro', category: 'board', minPlayers: 2, maxPlayers: 4, iconUrl: '🀄' },
  { id: 'game_trivia', title: 'Trivia Live', slug: 'trivia-live', category: 'quiz', minPlayers: 1, maxPlayers: 100, iconUrl: '💡' },
  { id: 'game_draw', title: 'Draw & Guess', slug: 'draw-guess', category: 'casual', minPlayers: 2, maxPlayers: 8, iconUrl: '🎨' },
  { id: 'game_bingo', title: 'Bingo Loco', slug: 'bingo-loco', category: 'casino', minPlayers: 2, maxPlayers: 50, iconUrl: '🔢' },
  { id: 'game_karaoke', title: 'Karaoke Battle', slug: 'karaoke-battle', category: 'music', minPlayers: 2, maxPlayers: 10, iconUrl: '🎤' },
];

const MISSIONS = [
  { id: 'mission_login', title: 'Login Diario', description: 'Entra a la app', type: 'daily_login', targetValue: 1, rewardType: 'coins', rewardAmount: 50 },
  { id: 'mission_room', title: 'Socializador', description: 'Entra a 3 salas de voz', type: 'join_room', targetValue: 3, rewardType: 'coins', rewardAmount: 100 },
  { id: 'mission_live', title: 'Espectador', description: 'Ve un live por 5 minutos', type: 'watch_live', targetValue: 1, rewardType: 'xp', rewardAmount: 20 },
  { id: 'mission_gift', title: 'Generoso', description: 'Envía 1 regalo', type: 'send_gift', targetValue: 1, rewardType: 'diamonds', rewardAmount: 5 },
  { id: 'mission_game', title: 'Jugador', description: 'Juega 2 partidas', type: 'play_game', targetValue: 2, rewardType: 'coins', rewardAmount: 150 },
];

const COIN_PACKAGES = [
  { id: 'coins_100', title: '100 Coins', coins: 100, bonusCoins: 0, totalCoins: 100, priceUsd: 0.99, productId: 'coins_100', googlePlayProductId: 'coins_100', sortOrder: 1 },
  { id: 'coins_550', title: '550 Coins', coins: 500, bonusCoins: 50, totalCoins: 550, priceUsd: 4.99, productId: 'coins_550', googlePlayProductId: 'coins_550', sortOrder: 2 },
  { id: 'coins_1200', title: '1,200 Coins', coins: 1000, bonusCoins: 200, totalCoins: 1200, priceUsd: 9.99, productId: 'coins_1200', googlePlayProductId: 'coins_1200', sortOrder: 3 },
  { id: 'coins_2800', title: '2,800 Coins', coins: 2500, bonusCoins: 300, totalCoins: 2800, priceUsd: 19.99, productId: 'coins_2800', googlePlayProductId: 'coins_2800', sortOrder: 4 },
  { id: 'coins_7000', title: '7,000 Coins', coins: 6000, bonusCoins: 1000, totalCoins: 7000, priceUsd: 49.99, productId: 'coins_7000', googlePlayProductId: 'coins_7000', sortOrder: 5 },
  { id: 'coins_15000', title: '15,000 Coins', coins: 12000, bonusCoins: 3000, totalCoins: 15000, priceUsd: 99.99, productId: 'coins_15000', googlePlayProductId: 'coins_15000', sortOrder: 6 },
];


export const seedInitialData = async () => {
  try {
    const batch = firestore().batch();
    const timestamp = nowServerTimestamp();

    // Seed Gifts
    for (const g of GIFTS) {
      const ref = firestore().collection(FirestoreCollections.GIFTS).doc(g.id);
      batch.set(ref, {
        name: g.name,
        priceCoins: g.priceCoins,
        valueDiamonds: g.valueDiamonds,
        rarity: g.rarity,
        iconUrl: g.iconUrl,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      }, { merge: true });
    }

    // Seed Games
    for (const gm of GAMES) {
      const ref = firestore().collection(FirestoreCollections.GAMES).doc(gm.id);
      batch.set(ref, {
        title: gm.title,
        titleLowercase: gm.title.trim().toLowerCase(),
        slug: gm.slug,
        category: gm.category,
        minPlayers: gm.minPlayers,
        maxPlayers: gm.maxPlayers,
        thumbnailUrl: gm.iconUrl,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      }, { merge: true });
    }

    // Seed Missions
    for (const m of MISSIONS) {
      const ref = firestore().collection(FirestoreCollections.MISSIONS).doc(m.id);
      batch.set(ref, {
        title: m.title,
        description: m.description,
        type: m.type,
        targetValue: m.targetValue,
        rewardType: m.rewardType,
        rewardAmount: m.rewardAmount,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      }, { merge: true });
    }

    // Seed Coin Packages
    for (const cp of COIN_PACKAGES) {
      const ref = firestore().collection(FirestoreCollections.COIN_PACKAGES).doc(cp.id);
      batch.set(ref, {
        title: cp.title,
        coins: cp.coins,
        bonusCoins: cp.bonusCoins,
        totalCoins: cp.totalCoins,
        priceUsd: cp.priceUsd,
        productId: cp.productId,
        googlePlayProductId: cp.googlePlayProductId,
        sortOrder: cp.sortOrder,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      }, { merge: true });
    }

    // Seed Host Rules (skip if already exist)
    const HOST_RULES_DATA = [
      { id: 'hr1', title: 'Respeta a todos los usuarios', description: 'Mantén un trato respetuoso y amable con toda la comunidad en todo momento.', isActive: true, sortOrder: 1 },
      { id: 'hr2', title: 'No contenido sexual o explícito', description: 'Está prohibido emitir contenido sexual, desnudos o material adulto de ningún tipo.', isActive: true, sortOrder: 2 },
      { id: 'hr3', title: 'No acoso ni discriminación', description: 'No toleramos el acoso, bullying ni discriminación por raza, género, religión u orientación sexual.', isActive: true, sortOrder: 3 },
      { id: 'hr4', title: 'No pedir pagos externos', description: 'Está prohibido solicitar pagos fuera de la plataforma. Solo se permite el sistema de gifts oficial.', isActive: true, sortOrder: 4 },
      { id: 'hr5', title: 'No fraudes ni promesas falsas', description: 'No realices sorteos falsos, fraudes ni promesas de regalos que no vas a entregar.', isActive: true, sortOrder: 5 },
      { id: 'hr6', title: 'No compartir datos privados', description: 'No compartas información personal de otros usuarios sin su consentimiento explícito.', isActive: true, sortOrder: 6 },
      { id: 'hr7', title: 'Cumple las reglas de moderación', description: 'Respeta las decisiones de los moderadores de la plataforma. El abuso puede resultar en suspensión.', isActive: true, sortOrder: 7 },
      { id: 'hr8', title: 'La plataforma revisa actividad antes de payouts', description: 'Los diamonds acumulados serán auditados antes de aprobar cualquier retiro de fondos.', isActive: true, sortOrder: 8 },
    ];

    for (const rule of HOST_RULES_DATA) {
      const ref = firestore().collection(FirestoreCollections.HOST_RULES).doc(rule.id);
      batch.set(ref, {
        title: rule.title,
        description: rule.description,
        isActive: rule.isActive,
        sortOrder: rule.sortOrder,
        createdAt: timestamp,
        updatedAt: timestamp,
      }, { merge: true });
    }

    // Commit all
    await batch.commit();

    // Seed Voice Rooms
    const roomCollection = firestore().collection(FirestoreCollections.ROOMS);
    const roomsSnap = await roomCollection.limit(1).get();
    if (roomsSnap.empty) {
      console.log('Seeding mock voice rooms...');
      const mockRoomsData = [
        { title: 'Karaoke Night 🎤', description: '¡Sube al escenario y canta tu tema favorito!', category: 'Karaoke', ownerId: 'system_host_1', ownerName: 'Carlos Singer', speakersCount: 1, listenersCount: 14, maxUsers: 200, maxSpeakers: 8, isLive: true, isPrivate: false, country: 'MX', language: 'es', tags: ['karaoke', 'musica', 'cantar'], status: 'active' },
        { title: 'Latin Party Mix 💃', description: 'Música latina y buena vibra. ¡Pide micrófono!', category: 'Fiesta', ownerId: 'system_host_2', ownerName: 'DJ Sofia', speakersCount: 2, listenersCount: 32, maxUsers: 200, maxSpeakers: 8, isLive: true, isPrivate: false, country: 'CO', language: 'es', tags: ['dance', 'fiesta', 'latin'], status: 'active' },
        { title: 'Debate de Fútbol ⚽', description: 'Hablemos de los partidos de la Champions League.', category: 'Debate', ownerId: 'system_host_3', ownerName: 'Gaby Deporte', speakersCount: 3, listenersCount: 8, maxUsers: 200, maxSpeakers: 8, isLive: true, isPrivate: false, country: 'ES', language: 'es', tags: ['futbol', 'champions', 'debate'], status: 'active' },
        { title: 'Chill Room & Chats ☕', description: 'Salas para charlar tranquilos después del trabajo.', category: 'Amistad', ownerId: 'system_host_4', ownerName: 'Relaxing Vibes', speakersCount: 1, listenersCount: 19, maxUsers: 200, maxSpeakers: 8, isLive: true, isPrivate: false, country: 'AR', language: 'es', tags: ['chill', 'charla', 'amigos'], status: 'active' },
        { title: 'Gamer Zone Talk 🎮', description: 'Hablando de lanzamientos y consolas. ¡Entra ya!', category: 'Juegos', ownerId: 'system_host_5', ownerName: 'PixelMaster', speakersCount: 4, listenersCount: 45, maxUsers: 200, maxSpeakers: 8, isLive: true, isPrivate: false, country: 'CL', language: 'es', tags: ['gamer', 'consolas', 'ludo'], status: 'active' },
        { title: 'Clases de Guitarra 🎸', description: 'Aprende acordes básicos de guitarra acústica hoy.', category: 'Música', ownerId: 'system_host_6', ownerName: 'Master Riff', speakersCount: 1, listenersCount: 9, maxUsers: 200, maxSpeakers: 8, isLive: true, isPrivate: false, country: 'PE', language: 'es', tags: ['guitarra', 'clase', 'musica'], status: 'active' }
      ];

      for (const room of mockRoomsData) {
        await roomCollection.add({
          ...room,
          titleLowercase: room.title.trim().toLowerCase(),
          hostIds: [room.ownerId],
          moderatorIds: [],
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
    }

    // Seed Live Streams
    const liveCollection = firestore().collection(FirestoreCollections.LIVES);
    const livesSnap = await liveCollection.limit(1).get();
    if (livesSnap.empty) {
      console.log('Seeding mock live streams...');
      const mockLivesData = [
        { hostId: 'system_host_1', hostName: 'Carlos Singer', hostUsername: 'carlossinger', hostPhotoURL: '', title: 'Concierto en Acústico 🎸', category: 'Música', country: 'MX', language: 'es', tags: ['musica', 'guitarra', 'acustico'], viewersCount: 24, peakViewersCount: 24, likesCount: 450, giftsCount: 12, diamondsEarned: 240, status: 'live', isPrivate: false, allowChat: true, allowGifts: true, moderatorIds: [] },
        { hostId: 'system_host_2', hostName: 'DJ Sofia', hostUsername: 'djsofia', hostPhotoURL: '', title: 'Latin House Live Set 🎧💃', category: 'Música', country: 'CO', language: 'es', tags: ['electronic', 'djset', 'house'], viewersCount: 110, peakViewersCount: 125, likesCount: 1980, giftsCount: 45, diamondsEarned: 1150, status: 'live', isPrivate: false, allowChat: true, allowGifts: true, moderatorIds: [] },
        { hostId: 'system_host_5', hostName: 'PixelMaster', hostUsername: 'pixelmaster', hostPhotoURL: '', title: 'Torneo Ludo Party en vivo 🎲', category: 'Juegos', country: 'CL', language: 'es', tags: ['ludo', 'juegos', 'vivo'], viewersCount: 48, peakViewersCount: 52, likesCount: 880, giftsCount: 18, diamondsEarned: 380, status: 'live', isPrivate: false, allowChat: true, allowGifts: true, moderatorIds: [] },
        { hostId: 'system_host_4', hostName: 'Relaxing Vibes', hostUsername: 'relaxing', hostPhotoURL: '', title: 'Noche de Vlogs y Preguntas ☕', category: 'Conversación', country: 'AR', language: 'es', tags: ['talkshow', 'noche', 'charla'], viewersCount: 35, peakViewersCount: 38, likesCount: 610, giftsCount: 9, diamondsEarned: 190, status: 'live', isPrivate: false, allowChat: true, allowGifts: true, moderatorIds: [] }
      ];

      for (const live of mockLivesData) {
        await liveCollection.add({
          ...live,
          titleLowercase: live.title.trim().toLowerCase(),
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
    }

    // Seed Karaoke Songs
    console.log('Seeding mock karaoke songs...');
    const mockSongsData = [
      {
        id: 'song_amazing_grace',
        title: 'Amazing Grace',
        artist: 'John Newton',
        language: 'en',
        genre: 'Gospel',
        durationSeconds: 180,
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
        audioUrl: '',
        instrumentalUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        lyricsText: 'Amazing grace! How sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found;\nWas blind, but now I see.',
        lyricsLrcUrl: '',
        sourceType: 'public_domain' as const,
        sourceUrl: '',
        uploadedBy: 'system',
        status: 'active' as const,
        isFeatured: true,
        playCount: 0,
        tags: ['classic', 'gospel', 'traditional'],
      },
      {
        id: 'song_cielito_lindo',
        title: 'Cielito Lindo',
        artist: 'Quirino Mendoza y Cortés',
        language: 'es',
        genre: 'Traditional',
        durationSeconds: 210,
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150',
        audioUrl: '',
        instrumentalUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        lyricsText: 'Ay, ay, ay, ay, canta y no llores\nPorque cantando se alegran\nCielito lindo, los corazones.',
        lyricsLrcUrl: '',
        sourceType: 'public_domain' as const,
        sourceUrl: '',
        uploadedBy: 'system',
        status: 'active' as const,
        isFeatured: true,
        playCount: 0,
        tags: ['mexico', 'mariachi', 'folclor'],
      },
      {
        id: 'song_demo_pop_beat',
        title: 'Demo Pop Beat',
        artist: 'PartyLive Studio',
        language: 'es',
        genre: 'Pop',
        durationSeconds: 120,
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150',
        audioUrl: '',
        instrumentalUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        lyricsText: 'Un, dos, tres, canta con el ritmo\nDeja que tu voz sea el algoritmo\nBaila y disfruta sin ningún abismo\nPartyLiveApp te lleva al optimismo!',
        lyricsLrcUrl: '',
        sourceType: 'licensed' as const,
        sourceUrl: '',
        uploadedBy: 'system',
        status: 'active' as const,
        isFeatured: true,
        playCount: 0,
        tags: ['pop', 'demo', 'dance'],
      }
    ];

    const songsCollection = firestore().collection(FirestoreCollections.KARAOKE_SONGS);
    for (const song of mockSongsData) {
      const keywords = buildKaraokeSongKeywords(song);
      await songsCollection.doc(song.id).set({
        ...song,
        titleLowercase: song.title.toLowerCase(),
        artistLowercase: song.artist.toLowerCase(),
        searchKeywords: keywords,
        createdAt: timestamp,
        updatedAt: timestamp,
      }, { merge: true });
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

