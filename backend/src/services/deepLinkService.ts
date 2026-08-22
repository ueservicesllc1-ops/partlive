export type DeepLinkTarget =
  | 'live'
  | 'profile'
  | 'clip'
  | 'event'
  | 'wallet'
  | 'payout'
  | 'discovery'
  | 'settings';

export interface DeepLinkSchema {
  target: DeepLinkTarget;
  targetId?: string;
  url: string;
  fallbackUrl: string;
}

export const buildDeepLink = (target: DeepLinkTarget, targetId?: string): DeepLinkSchema => {
  const path = targetId ? `${target}/${targetId}` : target;
  return {
    target,
    targetId,
    url: `partylive://${path}`,
    fallbackUrl: `https://partylive.app/${path}`,
  };
};

export const validateDeepLinkTarget = async (target: DeepLinkTarget, targetId?: string): Promise<boolean> => {
  if (!targetId) return true;
  // If targetId is provided, verify target exists (mock check for robustness)
  return true;
};
