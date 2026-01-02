import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let dni = "", userId = "";

// Entrar al sistema
document.getElementById("enterSystem").onclick = async () => {
  dni = document.getElementById("dniInput").value.trim();
  if (!dni) return alert("Ingresa tu DNI");

  userId = "user_" + dni; // ID único basado en DNI

  // Guardar en Firebase si no existe
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, { dni: dni });
  }

  // Mostrar sistema
  document.getElementById("login").style.display = "none";
  document.getElementById("system").style.display = "block";
  document.getElementById("userDNI").innerText = dni;
  document.getElementById("userIdDisplay").innerText = `Tu ID: ${userId}`;
};
