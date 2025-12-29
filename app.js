import { auth, provider, db } from "./firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");
const sendBtn = document.getElementById("send");

loginBtn.onclick = async () => {
  await signInWithPopup(auth, provider);
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("chat-container").style.display = "block";
    document.getElementById("user").innerText = user.email;
    cargarMensajes();
  }
});

sendBtn.onclick = async () => {
  const texto = document.getElementById("messageInput").value;
  if (texto === "") return;

  await addDoc(collection(db, "mensajes"), {
    texto,
    usuario: auth.currentUser.email,
    fecha: serverTimestamp()
  });

  document.getElementById("messageInput").value = "";
};

function cargarMensajes() {
  const q = query(collection(db, "mensajes"), orderBy("fecha"));
  onSnapshot(q, snapshot => {
    const messages = document.getElementById("messages");
    messages.innerHTML = "";
    snapshot.forEach(doc => {
      messages.innerHTML += `<p><b>${doc.data().usuario}:</b> ${doc.data().texto}</p>`;
    });
  });
}
