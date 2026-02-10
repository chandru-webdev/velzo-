import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAViUwEPYyFQR8ehc3Qk-Jz6SAeMVpwpw4",
    authDomain: "velzo-61b06.firebaseapp.com",
    projectId: "velzo-61b06",
    storageBucket: "velzo-61b06.firebasestorage.app",
    messagingSenderId: "936368171552",
    appId: "1:936368171552:web:4d47979a7b687467f56a45",
    measurementId: "G-MV98Y051XZ"
};

const app = initializeApp(firebaseConfig);

// Export the database instance
export const db = getFirestore(app);