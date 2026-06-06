import auth from '@react-native-firebase/auth';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Replace with your actual web client ID from Firebase Console
GoogleSignin.configure({
  webClientId: '1044304888588-oqi1sgdl66n74seq1fcb81cta59d72rn.apps.googleusercontent.com',
});

/**
 * Signs in a user using email and password.
 */
export const signInWithEmail = async (email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> => {
  return await auth().signInWithEmailAndPassword(email, password);
};

/**
 * Creates a new user account with email and password.
 */
export const signUpWithEmail = async (email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> => {
  return await auth().createUserWithEmailAndPassword(email, password);
};

/**
 * Signs in with Google
 */
export const signInWithGoogle = async (): Promise<FirebaseAuthTypes.UserCredential> => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  // @ts-ignore - Handle both old and new API versions of google-signin
  const idToken = response.data?.idToken || response.idToken;
  
  if (!idToken) {
    throw new Error('Google Sign-In failed: No ID token returned');
  }
  
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
  return auth().signInWithCredential(googleCredential);
};

/**
 * Signs out the currently authenticated user.
 */
export const signOut = async (): Promise<void> => {
  await GoogleSignin.signOut().catch(() => {});
  return auth().signOut();
};

/**
 * Send password reset email
 * @param email User email address
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  return auth().sendPasswordResetEmail(email);
};

/**
 * Retrieves the currently logged-in user.
 */
export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
  return auth().currentUser;
};

/**
 * Subscribes to changes in the user's authentication state.
 */
export const onAuthStateChangedListener = (
  callback: (user: FirebaseAuthTypes.User | null) => void
): (() => void) => {
  return auth().onAuthStateChanged(callback);
};
