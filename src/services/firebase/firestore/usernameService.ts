import firestore from '@react-native-firebase/firestore';

export interface UsernameRecord {
  uid: string;
  username: string;
  createdAt: string;
}

export const normalizeUsername = (username: string): string => {
  return username.trim().toLowerCase();
};

export const validateUsernameFormat = (username: string): { valid: boolean; error?: string } => {
  if (!username) return { valid: false, error: 'El nombre de usuario es requerido' };
  
  const trimmed = username.trim();
  if (trimmed.length < 3) return { valid: false, error: 'Debe tener al menos 3 caracteres' };
  if (trimmed.length > 20) return { valid: false, error: 'No debe exceder los 20 caracteres' };
  
  const regex = /^[a-z0-9._]+$/i;
  if (!regex.test(trimmed)) {
    return { valid: false, error: 'Solo se permiten letras, números, puntos y guiones bajos' };
  }
  
  return { valid: true };
};

export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      console.log('[UsernameCheck] Empty username, returning false');
      return false;
    }
    const docSnap = await firestore().collection('usernames').doc(normalized).get();
    console.log('[UsernameCheck] checked:', normalized, 'exists:', docSnap.exists);
    return !docSnap.exists;
  } catch (error: any) {
    console.error('Error checking username availability:', error);
    // Explicitly check for permission errors to guide the developer/user
    if (error.code === 'firestore/permission-denied' || error.message?.includes('permission')) {
      throw new Error('Error de seguridad/permisos en Firestore. Asegúrate de haber desplegado las reglas más recientes.');
    }
    throw error;
  }
};

export const reserveUsername = async (uid: string, username: string): Promise<void> => {
  const normalized = normalizeUsername(username);
  const isAvailable = await isUsernameAvailable(normalized);
  
  if (!isAvailable) {
    throw new Error('Ese nombre de usuario ya está en uso');
  }
  
  await firestore().collection('usernames').doc(normalized).set({
    uid,
    username,
    createdAt: new Date().toISOString()
  });
};

export const releaseUsername = async (username: string): Promise<void> => {
  if (!username) return;
  const normalized = normalizeUsername(username);
  await firestore().collection('usernames').doc(normalized).delete();
};

export const updateUsername = async (uid: string, oldUsername: string, newUsername: string): Promise<void> => {
  const normalizedOld = oldUsername ? normalizeUsername(oldUsername) : '';
  const normalizedNew = normalizeUsername(newUsername);
  
  if (normalizedOld === normalizedNew) return;
  
  const isAvailable = await isUsernameAvailable(normalizedNew);
  if (!isAvailable) {
    throw new Error('Ese nombre de usuario ya está en uso');
  }
  
  const batch = firestore().batch();
  
  const newRef = firestore().collection('usernames').doc(normalizedNew);
  batch.set(newRef, {
    uid,
    username: newUsername,
    createdAt: new Date().toISOString()
  });
  
  if (normalizedOld) {
    const oldRef = firestore().collection('usernames').doc(normalizedOld);
    batch.delete(oldRef);
  }
  
  await batch.commit();
};
