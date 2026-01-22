import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBuC1QerRui9WeFsOFFLJZGqterl0xzXdI",
  authDomain: "property-crm-15bca.firebaseapp.com",
  projectId: "property-crm-15bca",
  storageBucket: "property-crm-15bca.firebasestorage.app",
  messagingSenderId: "365506622114",
  appId: "1:365506622114:web:cc7c93e7115038d63b1dfb",
  measurementId: "G-BNYXD338N9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    return { success: true, user, idToken };
  } catch (error) {
    console.error("Google Sign In Error:", error);
    return { success: false, error: error.message };
  }
};

// Sign Out
export const firebaseSignOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Sign Out Error:", error);
    return { success: false, error: error.message };
  }
};

export { auth, googleProvider };
export default app;
