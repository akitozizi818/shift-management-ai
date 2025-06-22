import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore }  from "firebase/firestore";

const cfg = {
  apiKey   : process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export const app = initializeApp(cfg);
export const db  = getFirestore(app);

console.log("Firebase initialized with config:", {
  apiKey: cfg.apiKey,
  authDomain: cfg.authDomain,
    projectId: cfg.projectId,
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();