import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, setDoc, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// 🔹 Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAOSY1Ju8T5jexXSRsnZhHvsUZU0vvyixc",
  authDomain: "syscod7-d1753.firebaseapp.com",
  projectId: "syscod7-d1753",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let username = "Jesús";
let userId = "jesus_1234";
let currentChat = "";
let isPrivate = false;

// Funciones modales
document.getElementById("btnCreateGroup").onclick = ()=>document.getElementById("modalCreate").style.display="block";
document.getElementById("btnJoinGroup").onclick = ()=>document.getElementById("modalJoin").style.display="block";
document.getElementById("closeCreate").onclick = ()=>document.getElementById("modalCreate").style.display="none";
document.getElementById("closeJoin").onclick = ()=>document.getElementById("modalJoin").style.display="none";

// Aquí se agregarían funciones para crear/unirse grupos y enviar mensajes
// Esta es la base visual para que el chat funcione con Firebase en tiempo real
