import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ✅ COLE SUAS INFORMAÇÕES DO FIREBASE AQUI DENTRO
const firebaseConfig = {
  apiKey: "AIzaSyCLHmqR0bDmq7j-q-E0I456DlAgWMIKkgY",
  authDomain: "fittrack-59829.firebaseapp.com",
  projectId: "fittrack-59829",
  storageBucket: "fittrack-59829.firebasestorage.app",
  messagingSenderId: "384935605390",
  appId: "1:384935605390:web:2eb5540c6e3031781a85df",
  measurementId: "G-WRW5L3BY5D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { 
  auth, db, onAuthStateChanged, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  doc, setDoc, getDoc
};
