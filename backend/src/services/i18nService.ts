const DICTIONARY: Record<string, Record<string, string>> = {
  ES: {
    'home.liveNow': 'Transmitiendo en Vivo',
    'wallet.coins': 'Coins',
    'wallet.diamonds': 'Diamantes',
    'gift.send': 'Enviar Regalo',
    'profile.follow': 'Seguir',
    'support.needHelp': '¿Necesitas ayuda?',
  },
  EN: {
    'home.liveNow': 'Live Now',
    'wallet.coins': 'Coins',
    'wallet.diamonds': 'Diamonds',
    'gift.send': 'Send Gift',
    'profile.follow': 'Follow',
    'support.needHelp': 'Need help?',
  },
  PT: {
    'home.liveNow': 'Transmitindo Ao Vivo',
    'wallet.coins': 'Coins',
    'wallet.diamonds': 'Diamantes',
    'gift.send': 'Enviar Presente',
    'profile.follow': 'Seguir',
    'support.needHelp': 'Precisa de ajuda?',
  },
};

export const translateKey = (
  key: string,
  userLanguage: string = 'ES'
): string => {
  const langUpper = userLanguage.toUpperCase();

  // Fallback hierarchy: User Language -> ES -> EN
  if (DICTIONARY[langUpper] && DICTIONARY[langUpper][key]) {
    return DICTIONARY[langUpper][key];
  }
  if (DICTIONARY['ES'] && DICTIONARY['ES'][key]) {
    return DICTIONARY['ES'][key];
  }
  if (DICTIONARY['EN'] && DICTIONARY['EN'][key]) {
    return DICTIONARY['EN'][key];
  }

  return key; // Return raw key as absolute last resort
};

export const formatCurrencyAmount = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'es-EC'
): string => {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const formatDateLocale = (
  date: Date | string | number,
  locale: string = 'es-EC'
): string => {
  try {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return String(date);
  }
};
