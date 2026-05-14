import * as admin from 'firebase-admin';
import env from './env';

const initializeFirebase = () => {
  if (admin.apps.length > 0) return admin.app();

  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    console.warn('⚠️ Firebase Admin credentials missing. Phone verification will fail.');
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
  });
};

const firebaseAdmin = initializeFirebase();

export default firebaseAdmin;
