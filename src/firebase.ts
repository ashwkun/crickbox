import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "***REMOVED***",
    authDomain: "theboxcric.firebaseapp.com",
    projectId: "theboxcric",
    storageBucket: "theboxcric.firebasestorage.app",
    messagingSenderId: "438552981311",
    appId: "1:438552981311:web:af0107f0f7a7de61f03888",
    measurementId: "G-VLW9XDKXCS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider };
