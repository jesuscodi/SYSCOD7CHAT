import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAOSY1Ju8T5jexXSRsnZhHvsUZU0vvyixc",
  authDomain: "syscod7-d1753.firebaseapp.com ",
  projectId: "syscod7-d1753",
  storageBucket: "syscod7-d1753.firebasestorage.app.appspot.com",
  messagingSenderId: "162544196092",
  appId: "1:162544196092:web:6a84701201f6731627fa79"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
