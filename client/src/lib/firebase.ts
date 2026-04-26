import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAoHaJhr8hBjigw0GIIjF2K8_Zg0L4JUhc",
  authDomain: "skillscout-server.firebaseapp.com",
  projectId: "skillscout-server",
  storageBucket: "skillscout-server.firebasestorage.app",
  messagingSenderId: "166161979927",
  appId: "1:166161979927:web:9e2e5e3da68c312a1e9a52",
  measurementId: "G-WJ5488FBCF"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
