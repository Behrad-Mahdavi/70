import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACeGw2SzZsXilOzVdjsCqYAq6y29SbMrc",
  authDomain: "seeband-d9543.firebaseapp.com",
  projectId: "seeband-d9543",
  storageBucket: "seeband-d9543.firebasestorage.app",
  messagingSenderId: "500984532090",
  appId: "1:500984532090:web:aa083c5804e8f05d81ffc3",
  measurementId: "G-6SN2SKZT8Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only if supported (browser environment)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not available, continue without it
  });
}

export { analytics };
export const auth = getAuth(app);
export const db = getFirestore(app);