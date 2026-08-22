import { db } from '../config/firebase';
import { MusicTrack } from '../seeds/seedMusicCatalog';

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  track?: MusicTrack;
}

export const checkTrackAccess = async (
  trackId: string,
  countryCode: string = 'US'
): Promise<AccessCheckResult> => {
  const snap = await db.collection('musicTracks').doc(trackId).get();
  if (!snap.exists) return { allowed: false, reason: 'TRACK_NOT_FOUND' };

  const track = snap.data() as MusicTrack;

  if (track.status !== 'ACTIVE') return { allowed: false, reason: 'TRACK_INACTIVE', track };

  // 1. Check rights status
  if (['RESTRICTED', 'UNKNOWN', 'EXPIRED', 'BLOCKED'].includes(track.rightsStatus)) {
    return { allowed: false, reason: `RIGHTS_${track.rightsStatus}`, track };
  }

  // 2. Check license expiration date
  if (track.licenseEnd) {
    const endMs = new Date(track.licenseEnd).getTime();
    if (Date.now() > endMs) {
      return { allowed: false, reason: 'LICENSE_EXPIRED', track };
    }
  }

  // 3. Check blocked countries
  if (track.blockedCountries && track.blockedCountries.includes(countryCode.toUpperCase())) {
    return { allowed: false, reason: 'TERRITORY_BLOCKED', track };
  }

  // 4. Check allowed countries
  if (
    track.allowedCountries &&
    !track.allowedCountries.includes('ALL') &&
    !track.allowedCountries.includes(countryCode.toUpperCase())
  ) {
    return { allowed: false, reason: 'TERRITORY_NOT_PERMITTED', track };
  }

  return { allowed: true, track };
};

export const getLicensedCatalog = async (
  countryCode: string = 'US',
  genre?: string
): Promise<MusicTrack[]> => {
  const snap = await db.collection('musicTracks')
    .where('status', '==', 'ACTIVE')
    .limit(50)
    .get();

  const accessible: MusicTrack[] = [];
  const upperCountry = countryCode.toUpperCase();

  for (const doc of snap.docs) {
    const track = doc.data() as MusicTrack;
    if (['LICENSED', 'ROYALTY_FREE', 'PUBLIC_DOMAIN'].includes(track.rightsStatus)) {
      if (!track.blockedCountries?.includes(upperCountry)) {
        if (
          track.allowedCountries?.includes('ALL') ||
          track.allowedCountries?.includes(upperCountry)
        ) {
          if (!genre || track.genre.toLowerCase().includes(genre.toLowerCase())) {
            accessible.push(track);
          }
        }
      }
    }
  }

  return accessible;
};
