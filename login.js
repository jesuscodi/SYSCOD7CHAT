import { db } from "./firebase.js";
import { collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const btnRegistro = document.getElementById("btnRegistro");

const usuariosCollection = collection(db, "usuarios");

// Función para verificar si usuario existe con email
async function buscarUsuario(email) {
  const q = query(usuariosCollection, where("email", "==", email));
  const resultado = await getDocs(q);
  return resultado.docs.length > 0 ? resultado.docs[0] : null;
}

// Registrar usuario
btnRegistro.onclick = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) return alert("Complete todos los campos");

  const usuarioExistente = await buscarUsuario(email);
  if (usuarioExistente) return alert("El usuario ya existe");

  await addDoc(usuariosCollection, { email, password });
  alert("Usuario registrado correctamente");
  emailInput.value = "";
  passwordInput.value = "";
};

// Iniciar sesión
btnLogin.onclick = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) return alert("Complete todos los campos");

  const q = query(usuariosCollection, where("email", "==", email), where("password", "==", password));
  const resultado = await getDocs(q);

  if (resultado.empty) {
    alert("Usuario o contraseña incorrectos");
  } else {
    localStorage.setItem("usuario", email);
    window.location = "dashboard.html";
  }
};
