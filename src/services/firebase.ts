import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVXSQoP5t9uCB6bK9sd_9hh8FLo9QaQ_0",
  authDomain: "piii-move.firebaseapp.com",
  projectId: "piii-move",
  storageBucket: "piii-move.firebasestorage.app",
  messagingSenderId: "1061307628985",
  appId: "1:1061307628985:web:85334c14fa860c37388a68",
  measurementId: "G-154478EBZW"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios que usaremos
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;