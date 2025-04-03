import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAR-2MOb-kzFPV4-HctWiAUaxJaCImId8M",
  authDomain: "inventory-b1a9a.firebaseapp.com",
  projectId: "inventory-b1a9a",
  storageBucket: "inventory-b1a9a.firebasestorage.app",
  messagingSenderId: "460506147945",
  appId: "1:460506147945:web:535d39d292e591929686f8",
  measurementId: "G-1T8X58X3NQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Only connect to emulators if explicitly enabled
if (process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
}

// Initialize Analytics only in production
const analytics = process.env.NODE_ENV === 'production' ? getAnalytics(app) : null;

export { auth, db, analytics };
export default app; 