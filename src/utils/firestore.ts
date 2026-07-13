/**
 * Safely checks if a Firestore document snapshot exists.
 * Handles cases where exists is a function (doc.exists()) or a property (doc.exists).
 */
export const docExists = (doc: any): boolean => {
  if (!doc) return false;
  if (typeof doc.exists === 'function') {
    return doc.exists();
  }
  return !!doc.exists;
};
