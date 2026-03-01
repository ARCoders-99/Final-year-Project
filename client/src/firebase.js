// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAsSPWWlQWiTGMK0uWAT-XrMBKO9u5JAVE",
    authDomain: "library-management-syste-1d953.firebaseapp.com",
    projectId: "library-management-syste-1d953",
    storageBucket: "library-management-syste-1d953.firebasestorage.app",
    messagingSenderId: "438774573113",
    appId: "1:438774573113:web:a10e82876049bc6aee45e8",
    measurementId: "G-RB5CBVJXNW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
