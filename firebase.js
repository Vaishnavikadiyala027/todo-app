// Firebase setup
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCzXXupucCfo9UhHbWEgm_CRaMMWohb7hs",
  authDomain: "task-manager-27e20.firebaseapp.com",
  projectId: "task-manager-27e20",
  storageBucket: "task-manager-27e20.firebasestorage.app",
  messagingSenderId: "451375386371",
  appId: "1:451375386371:web:a736cd7721242939a32336",
  measurementId: "G-NMKKMWVK86"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);