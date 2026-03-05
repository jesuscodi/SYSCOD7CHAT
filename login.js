import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ===== ELEMENTOS ===== */

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const btnLogin = document.getElementById("btnLogin");
const btnRegistro = document.getElementById("btnRegistro");
const mensaje = document.getElementById("mensaje");

const usuariosCollection = collection(db, "usuarios");

/* ===== MENSAJES ===== */

function mostrarMensaje(texto, color="red"){
  mensaje.textContent = texto;
  mensaje.style.color = color;

  setTimeout(()=>{
    mensaje.textContent="";
  },4000);
}

/* =============================
   REGISTRO
============================= */

btnRegistro.onclick = async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if(!email || !password){
    mostrarMensaje("Complete todos los campos");
    return;
  }

  try{

    await createUserWithEmailAndPassword(auth,email,password);

    mostrarMensaje("Usuario registrado ✅","green");

  }catch(error){
    console.log(error);
    mostrarMensaje(error.message);
  }
};

/* =============================
   LOGIN
============================= */

btnLogin.onclick = async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if(!email || !password){
    mostrarMensaje("Complete todos los campos");
    return;
  }

  try{

    await signInWithEmailAndPassword(auth,email,password);

    localStorage.setItem("usuario",email);

    mostrarMensaje("Ingresando...","green");

    setTimeout(()=>{
      window.location="dashboard.html";
    },1000);

  }catch(error){
    mostrarMensaje("Usuario o contraseña incorrectos");
  }

};
