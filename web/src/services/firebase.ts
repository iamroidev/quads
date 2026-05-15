import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCopADlsdsp6jE7y-27ofn86HkotlX4VKA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'quads-37f1f.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'quads-37f1f',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'quads-37f1f.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '912061029071',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:912061029071:web:2a35cae3a428281cc175ba',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Helper to setup reCAPTCHA
export const setupRecaptcha = (containerId: string) => {
  if (!(window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved
      }
    });
  }
  return (window as any).recaptchaVerifier;
};

// Helper to send OTP
export const sendOtp = async (phoneNumber: string, appVerifier: any): Promise<ConfirmationResult> => {
  try {
    return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};
