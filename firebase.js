// Importaciones
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TU CONFIG (la copias de firebase)
const firebaseConfig = {
  apiKey: "AIzaSyDNd6f8zriP3U-1-zLTD0e_c45H73lEg1o",
  authDomain: "escueladominicalreydereyes.firebaseapp.com",
  projectId: "escueladominicalreydereyes",
  storageBucket: "escueladominicalreydereyes.firebasestorage.app",
  messagingSenderId: "891424130656",
  appId: "1:891424130656:web:8b0e92dd4cf00ab40ce505"
};

// Inicializar
const app = initializeApp(firebaseConfig);

// Servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
