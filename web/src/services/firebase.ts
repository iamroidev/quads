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
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Recaptcha container with id "${containerId}" not found in DOM`);
  }

  // If we already have a verifier, check if it's still valid
  // In some cases (HMR or navigation), we might need to recreate it
  if ((window as any).recaptchaVerifier) {
    try {
      // Clear the old one if it exists to be safe
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      // Ignore errors during clear
    }
    (window as any).recaptchaVerifier = null;
  }

  (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    'size': 'invisible',
    'callback': () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      // Response expired. Ask user to solve reCAPTCHA again.
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.reset();
      }
    }
  });

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
