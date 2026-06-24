// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// VEEBHA: Replace the values inside the quotes with the keys Ansh sends you!
const firebaseConfig = {
  apiKey: "AIzaSyDJMy3WVxg3zKvLh7de0bAO9KifUNXd7tk",
  authDomain: "udhaarscore-483b8.firebaseapp.com",
  projectId: "udhaarscore-483b8",
  storageBucket: "udhaarscore-483b8.firebasestorage.app",
  messagingSenderId: "592798564867",
  appId: "1:592798564867:android:905aab4761f8aa15124436"
};

// This turns on the connection
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };