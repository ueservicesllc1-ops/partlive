/**
 * Normalizes a string: converts to lowercase, removes diacritics/accents,
 * removes special characters and double spaces.
 */
export const normalizeSearchText = (value: string): string => {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, '') // remove special characters
    .replace(/\s+/g, ' '); // collapse spaces
};

/**
 * Tokenizes normalized search text into individual word tokens.
 */
export const tokenizeSearchText = (value: string): string[] => {
  const normalized = normalizeSearchText(value);
  if (!normalized) return [];
  return normalized.split(' ').filter(token => token.length > 0);
};

/**
 * Generates combinations/prefixes of keywords for array-contains search.
 * Generates prefixes of lengths 1 to length of token.
 */
export const buildSearchKeywords = (values: string[]): string[] => {
  const keywordSet = new Set<string>();
  
  for (const rawValue of values) {
    const tokens = tokenizeSearchText(rawValue);
    for (const token of tokens) {
      // Add all prefixes of the token (for "maria", add "m", "ma", "mar", "mari", "maria")
      for (let i = 1; i <= token.length; i++) {
        keywordSet.add(token.substring(0, i));
      }
      keywordSet.add(token);
    }
  }

  return Array.from(keywordSet);
};

/**
 * Returns the range query parameters for Firestore "startsWith" behavior.
 */
export const startsWithSearchRange = (query: string) => {
  const normalized = normalizeSearchText(query);
  return {
    start: normalized,
    end: normalized + '\uf8ff',
  };
};
