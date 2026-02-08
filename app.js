import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const email = document.getElementById("email");
const password = document.getElementById("password");

if (document.getElementById("btnLogin")) {

  document.getElementById("btnLogin").addEventListener("click", async () => {
    try {
      await signInWithEmailAndPassword(auth, email.value, password.value);
      window.location = "dashboard.html";
    } catch (error) {
      alert(error.message);
    }
  });

  document.getElementById("btnRegistro").addEventListener("click", async () => {
    try {
      const user = await createUserWithEmailAndPassword(auth, email.value, password.value);

      // guardar rol
      await setDoc(doc(db, "usuarios", user.user.uid), {
        email: email.value,
        rol: "maestro" // luego puedes cambiar a admin
      });

      alert("Usuario creado");
    } catch (error) {
      alert(error.message);
    }
  });

}
