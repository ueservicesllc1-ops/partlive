import { db } from '../config/firebase';

export interface MusicTrack {
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  durationSeconds: number;
  genre: string;
  language: string;
  rightsStatus: 'LICENSED' | 'PUBLIC_DOMAIN' | 'ROYALTY_FREE' | 'RESTRICTED' | 'UNKNOWN' | 'EXPIRED';
  allowedCountries: string[];
  blockedCountries: string[];
  licenseStart?: string;
  licenseEnd?: string;
  recordingAllowed: boolean;
  clipAllowed: boolean;
  monetizationAllowed: boolean;
  audioUrl: string;
  lyricsUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

const SAMPLE_TRACKS: Omit<MusicTrack, 'createdAt'>[] = [
  {
    trackId: 'track_party_theme',
    title: 'PartyLive Anthem',
    artist: 'PartyLive Studio Band',
    durationSeconds: 180,
    genre: 'Pop / Electronic',
    language: 'ES',
    rightsStatus: 'LICENSED',
    allowedCountries: ['US', 'EC', 'MX', 'CO', 'PE', 'CL', 'ES'],
    blockedCountries: [],
    recordingAllowed: true,
    clipAllowed: true,
    monetizationAllowed: true,
    audioUrl: 'https://cdn.partylive.app/music/partylive-anthem.mp3',
    status: 'ACTIVE',
  },
  {
    trackId: 'track_latin_rhythm',
    title: 'Ritmo Latino Karaoke',
    artist: 'PartyLive House Band',
    durationSeconds: 210,
    genre: 'Salsa',
    language: 'ES',
    rightsStatus: 'ROYALTY_FREE',
    allowedCountries: ['ALL'],
    blockedCountries: [],
    recordingAllowed: true,
    clipAllowed: true,
    monetizationAllowed: true,
    audioUrl: 'https://cdn.partylive.app/music/salsa-karaoke.mp3',
    status: 'ACTIVE',
  },
  {
    trackId: 'track_restricted_demo',
    title: 'Restricted Regional Hit',
    artist: 'Regional Star',
    durationSeconds: 200,
    genre: 'Urban',
    language: 'ES',
    rightsStatus: 'LICENSED',
    allowedCountries: ['US'],
    blockedCountries: ['EC', 'MX'],
    recordingAllowed: false,
    clipAllowed: false,
    monetizationAllowed: false,
    audioUrl: 'https://cdn.partylive.app/music/restricted.mp3',
    status: 'ACTIVE',
  },
];

export const seedMusicCatalog = async () => {
  console.log('[Seed] Seeding Music Catalog & Rights Config...');
  const timestamp = new Date().toISOString();

  await db.collection('systemConfig').doc('music').set({
    catalogEnabled: true,
    defaultAllowedCountries: ['US', 'EC', 'MX', 'CO', 'PE', 'CL', 'ES'],
    audioFingerprintingEnabled: false,
    copyrightStrikeLimit: 3,
    updatedAt: timestamp,
  }, { merge: true });

  const batch = db.batch();
  for (const track of SAMPLE_TRACKS) {
    const ref = db.collection('musicTracks').doc(track.trackId);
    batch.set(ref, { ...track, createdAt: timestamp }, { merge: true });
  }

  await batch.commit();
  console.log(`[Seed] ✅ Music Catalog Seeded: ${SAMPLE_TRACKS.length} tracks.`);
};

if (require.main === module) {
  seedMusicCatalog()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Music Catalog Error]:', err);
      process.exit(1);
    });
}
