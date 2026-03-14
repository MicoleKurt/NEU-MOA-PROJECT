import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJJNdMUMZoNndCwjLbH4MyBNlLz6sD-tM",
  authDomain: "neu-moa-monitoring-556b5.firebaseapp.com",
  projectId: "neu-moa-monitoring-556b5",
  storageBucket: "neu-moa-monitoring-556b5.firebasestorage.app",
  messagingSenderId: "886301932678",
  appId: "1:886301932678:web:ec92f1cbf7278981ff2507"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
export default app;
