// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDZAZLufgHwhQiCX20lUmSsTQM0Z978IQo",
  authDomain: "iris-bellezas-backend.firebaseapp.com",
  projectId: "iris-bellezas-backend",
  storageBucket: "iris-bellezas-backend.firebasestorage.app",
  messagingSenderId: "934477942035",
  appId: "1:934477942035:web:f66a9c348e6caa2a575ee6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configurar Firestore para permitir acceso desde cualquier origen en desarrollo
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  // En producción, esto debería estar configurado en las reglas de seguridad de Firebase
  console.log('Firebase initialized for external access');
}