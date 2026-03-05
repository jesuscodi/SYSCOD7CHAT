import { db } from "./firebase.js";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===== ELEMENTOS HTML ===== */

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const btnLogin = document.getElementById("btnLogin");
const btnRegistro = document.getElementById("btnRegistro");

const mensaje = document.getElementById("mensaje");

const usuariosCollection = collection(db, "usuarios");

/* ===== FUNCION MENSAJES ===== */

function mostrarMensaje(texto, color = "red") {
  mensaje.textContent = texto;
  mensaje.style.color = color;

  setTimeout(() => {
    mensaje.textContent = "";
  }, 4000);
}

/* =============================
   REGISTRO
============================= */

btnRegistro.onclick = async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    mostrarMensaje("Complete todos los campos");
    return;
  }

  try {

    // Verificar si usuario existe
    const q = query(
      usuariosCollection,
      where("email", "==", email)
    );

    const resultado = await getDocs(q);

    if (!resultado.empty) {
      mostrarMensaje("El usuario ya existe");
      return;
    }

    await addDoc(usuariosCollection, {
      email,
      password
    });

    mostrarMensaje("Usuario registrado ✅", "green");

    emailInput.value = "";
    passwordInput.value = "";

  } catch (error) {
    console.log(error);
    mostrarMensaje("Error al registrar usuario");
  }
};

/* =============================
   LOGIN
============================= */

btnLogin.onclick = async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    mostrarMensaje("Complete todos los campos");
    return;
  }

  try {

    const q = query(
      usuariosCollection,
      where("email", "==", email),
      where("password", "==", password)
    );

    const resultado = await getDocs(q);

    if (resultado.empty) {
      mostrarMensaje("Usuario o contraseña incorrectos");
      return;
    }

    localStorage.setItem("usuario", email);

    mostrarMensaje("Ingresando...", "green");

    setTimeout(() => {
      window.location = "dashboard.html";
    }, 1000);

  } catch (error) {
    console.log(error);
    mostrarMensaje(error.message);
  }

};
