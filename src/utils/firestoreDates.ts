import firestore from '@react-native-firebase/firestore';

/**
 * Returns a server timestamp for saving to Firestore.
 */
export const nowServerTimestamp = () => {
  return firestore.FieldValue.serverTimestamp();
};

/**
 * Safely converts a Firestore Timestamp or Date object into a JS Date object.
 * @param value any timestamp-like value from Firestore or JS Date
 * @returns Date object or null if invalid
 */
export const toDateSafe = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') return new Date(value);
  return null;
};

/**
 * Generates a YYYY-MM-DD string from a date, useful for Daily Missions or Daily records.
 * @param date JS Date object
 * @returns string format YYYY-MM-DD
 */
export const dateToDateKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
