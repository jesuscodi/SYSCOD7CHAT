import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, setDoc } 
from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// 🔴 Configura Firebase aquí
const firebaseConfig = {
  apiKey: "AIzaSyAOSY1Ju8T5jexXSRsnZhHvsUZU0vvyixc",
  authDomain: "syscod7-d1753.firebaseapp.com",
  projectId: "syscod7-d1753",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let username = "";
let groupName = "";

// Entrar al chat
document.getElementById("enterChat").onclick = async () => {
  const nameInput = document.getElementById("usernameInput").value.trim();
  const groupInput = document.getElementById("groupInput").value.trim();
  const groupPass = document.getElementById("groupPassword").value.trim();
  
  if(!nameInput || !groupInput || !groupPass) return alert("Completa todos los campos");

  username = nameInput;
  groupName = groupInput;

  // Revisar si el grupo ya existe
  const groupRef = doc(db, "groups", groupName);
  const groupSnap = await getDoc(groupRef);

  if(!groupSnap.exists()) {
    // Crear grupo nuevo con clave
    await setDoc(groupRef, { password: groupPass });
  } else {
    // Validar clave
    if(groupSnap.data().password !== groupPass) {
      return alert("Clave incorrecta para este grupo");
    }
  }

  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
  document.getElementById("userName").innerText = "Hola, " + username;
  document.getElementById("groupName").innerText = "Grupo: " + groupName;

  loadMessages();
};

// Enviar mensaje
document.getElementById("sendMessage").onclick = async () => {
  const text = document.getElementById("messageInput").value.trim();
  if(!text) return;

  await addDoc(collection(db, "groups", groupName, "messages"), {
    user: username,
    text,
    timestamp: serverTimestamp()
  });

  document.getElementById("messageInput").value = "";
};

// Cargar mensajes en tiempo real
function loadMessages() {
  const messagesDiv = document.getElementById("messages");
  const q = query(collection(db, "groups", groupName, "messages"), orderBy("timestamp"));

  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.classList.add("message");
      div.classList.add(msg.user === username ? "me" : "other");
      const time = msg.timestamp ? new Date(msg.timestamp.seconds*1000).toLocaleTimeString() : "";
      div.innerHTML = `<b>${msg.user}:</b> ${msg.text} <small>${time}</small>`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}
