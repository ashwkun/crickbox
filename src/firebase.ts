import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/**
 * Firebase Configuration
 * 
 * Note: These keys are safe to expose in client-side code.
 * They are restricted by domain in Firebase Console, not by secrecy.
 * See: https://firebase.google.com/docs/projects/api-keys
 */
const firebaseConfig = {
    apiKey: "AIzaSyDF_OMVxkV1TG2KgO0Q0o5mZMr9apz5K5g",
    authDomain: "theboxcric.firebaseapp.com",
    projectId: "theboxcric",
    storageBucket: "theboxcric.firebasestorage.app",
    messagingSenderId: "146609239836",
    appId: "1:146609239836:web:6b0f8842272b1392e02cd9",
    measurementId: "G-XL02JHL6P6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider };
