// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1roUmKHZf7h33eakLo-TiJWmmE1GvliY",
  authDomain: "mtuassets.firebaseapp.com",
  projectId: "mtuassets",
  storageBucket: "mtuassets.firebasestorage.app",
  messagingSenderId: "740146781392",
  appId: "1:740146781392:web:3b04ebe2bc5bcd88b492d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
