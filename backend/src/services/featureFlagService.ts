import { db } from '../config/firebase';

export type FeatureFlagName =
  | 'pkEnabled'
  | 'vipEnabled'
  | 'clubsEnabled'
  | 'karaokeEnabled'
  | 'gamesEnabled'
  | 'eventsEnabled'
  | 'clipsEnabled'
  | 'aiEnabled'
  | 'subscriptionsEnabled'
  | 'agenciesEnabled'
  | 'promotionsEnabled';

export const isFeatureEnabled = async (featureName: FeatureFlagName): Promise<boolean> => {
  try {
    const doc = await db.collection('systemConfig').doc('features').get();
    if (!doc.exists) return true; // Default fallback to enabled
    const features = doc.data()!;
    return features[featureName] !== false;
  } catch (err) {
    console.error(`Error checking feature flag ${featureName}:`, err);
    return true;
  }
};

export const getSystemFeatureFlags = async (): Promise<Record<string, boolean>> => {
  const doc = await db.collection('systemConfig').doc('features').get();
  if (!doc.exists) {
    return {
      pkEnabled: true,
      vipEnabled: true,
      clubsEnabled: true,
      karaokeEnabled: true,
      gamesEnabled: true,
      eventsEnabled: true,
      clipsEnabled: true,
      aiEnabled: true,
      subscriptionsEnabled: true,
      agenciesEnabled: true,
      promotionsEnabled: true,
    };
  }
  return doc.data() as Record<string, boolean>;
};
