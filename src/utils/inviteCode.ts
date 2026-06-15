const INVITE_CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates a random alphanumeric invite code of the specified length.
 * Excludes confusing characters like 0, O, 1, I.
 */
export const generateInviteCode = (length = 6): string => {
  let result = '';
  const charactersLength = INVITE_CODE_CHARACTERS.length;
  for (let i = 0; i < length; i++) {
    result += INVITE_CODE_CHARACTERS.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

/**
 * Normalizes an invite code (trim and uppercase).
 */
export const normalizeInviteCode = (code: string): string => {
  return code.trim().toUpperCase();
};

/**
 * Validates if a code matches the expected pattern of letters/numbers (excluding confusing ones).
 */
export const isValidInviteCode = (code: string, length = 6): boolean => {
  const normalized = normalizeInviteCode(code);
  if (normalized.length !== length) return false;
  
  // Regex pattern matching only characters present in INVITE_CODE_CHARACTERS
  const regex = new RegExp(`^[${INVITE_CODE_CHARACTERS}]{${length}}$`);
  return regex.test(normalized);
};
