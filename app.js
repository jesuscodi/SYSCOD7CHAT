import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// 🔴 Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAOSY1Ju8T5jexXSRsnZhHvsUZU0vvyixc",
  authDomain: " syscod7-d1753.firebaseapp.com",
  projectId: "syscod7-d1753",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let username = "";

// Entrar al chat
document.getElementById("enterChat").onclick = () => {
  const input = document.getElementById("usernameInput").value.trim();
  if(input === "") return alert("Ingresa un nombre");
  username = input;
  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
  document.getElementById("userName").innerText = "Hola, " + username;
  loadMessages(); // cargar mensajes históricos
};

// Enviar mensaje
document.getElementById("sendMessage").onclick = async () => {
  const text = document.getElementById("messageInput").value.trim();
  if(text === "") return;
  
  await addDoc(collection(db, "messages"), {
    text,
    user: username,
    timestamp: serverTimestamp()
  });

  document.getElementById("messageInput").value = "";
};

// Cargar mensajes en tiempo real
function loadMessages() {
  const messagesDiv = document.getElementById("messages");
  const q = query(collection(db, "messages"), orderBy("timestamp"));
  
  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      const time = msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString() : "";
      messagesDiv.innerHTML += `<div class="message"><b>${msg.user}:</b> ${msg.text} <small>${time}</small></div>`;
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
