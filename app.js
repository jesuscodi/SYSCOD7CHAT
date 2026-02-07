import { auth } from "./firebase.js";
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const email = document.getElementById("email");
const password = document.getElementById("password");

document.getElementById("btnLogin").addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    alert("Bienvenido");
    window.location = "dashboard.html";
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("btnRegistro").addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    alert("Cuenta creada");
  } catch (error) {
    alert(error.message);
  }
});
