// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Replace with your web app's Firebase configuration
// You can find this in your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyDO4a-57crAv1n-ZJc2NV8KgtQoZapmSls",
  authDomain: "arc-studio-box.firebaseapp.com",
  projectId: "arc-studio-box",
  storageBucket: "arc-studio-box.firebasestorage.app",
  messagingSenderId: "784508378100",
  appId: "1:784508378100:web:7cc80d825c1d5ae713b7a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage, app };