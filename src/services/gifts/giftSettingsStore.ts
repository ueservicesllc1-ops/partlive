import { useState, useEffect } from 'react';

export interface GiftSettings {
  soundsEnabled: boolean;
  animationsEnabled: boolean;
}

let globalSettings: GiftSettings = {
  soundsEnabled: true,
  animationsEnabled: true,
};

const listeners = new Set<(settings: GiftSettings) => void>();

export const getGiftSettings = (): GiftSettings => ({ ...globalSettings });

export const setGiftSettings = (newSettings: Partial<GiftSettings>) => {
  globalSettings = { ...globalSettings, ...newSettings };
  listeners.forEach((listener) => listener({ ...globalSettings }));
};

export const useGiftSettings = (): [GiftSettings, (s: Partial<GiftSettings>) => void] => {
  const [settings, setSettings] = useState<GiftSettings>({ ...globalSettings });

  useEffect(() => {
    const handleUpdate = (updated: GiftSettings) => {
      setSettings({ ...updated });
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return [settings, setGiftSettings];
};
