/**
 * Firebase Config Notes - PartyLiveApp Android
 * 
 * On Android, the Firebase SDK loads configuration values directly from:
 * android/app/google-services.json
 * 
 * The google-services Gradle plugin converts this file into Android resources
 * during compilation, which are then read automatically by `@react-native-firebase/app`
 * upon startup. No manual Javascript initialization keys are required.
 * 
 * To obtain the google-services.json:
 * 1. Go to the Firebase Console: https://console.firebase.google.com/
 * 2. Select or create your project: "PartyLiveApp"
 * 3. Register your Android App with Package Name: "com.partylive.app"
 * 4. Download 'google-services.json' and place it in the project at:
 *    android/app/google-services.json
 */
export const FIREBASE_ANDROID_PACKAGE_NAME = 'com.partylive.app';
