import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBbxOPkyaIvFkPPsRqwhRRJbgrNtJTIljg",
  authDomain: "nebulafunded-19f32.firebaseapp.com",
  projectId: "nebulafunded-19f32",
  storageBucket: "nebulafunded-19f32.firebasestorage.app",
  messagingSenderId: "615992812643",
  appId: "1:615992812643:web:53f625710b583c8b968456",
  measurementId: "G-51TGNZKSLF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
