import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, setDoc } 
from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// 🔴 Configura Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let username = "";
let currentChat = ""; // grupo o chat privado
let isPrivate = false;

// Entrar al sistema
document.getElementById("enterSystem").onclick = () => {
  const nameInput = document.getElementById("usernameInput").value.trim();
  if(!nameInput) return alert("Ingresa tu nombre");
  username = nameInput;
  document.getElementById("login").style.display = "none";
  document.getElementById("system").style.display = "block";
  document.getElementById("userName").innerText = username;
};

// Crear grupo
document.getElementById("createGroup").onclick = async () => {
  const name = document.getElementById("newGroupName").value.trim();
  const pass = document.getElementById("newGroupPassword").value.trim();
  if(!name || !pass) return alert("Completa los campos");
  
  const groupRef = doc(db, "groups", name);
  const groupSnap = await getDoc(groupRef);
  if(groupSnap.exists()) return alert("Grupo ya existe");

  await setDoc(groupRef, { password: pass });
  openChat(name, false);
};

// Unirse a grupo
document.getElementById("joinGroup").onclick = async () => {
  const name = document.getElementById("joinGroupName").value.trim();
  const pass = document.getElementById("joinGroupPassword").value.trim();
  if(!name || !pass) return alert("Completa los campos");

  const groupRef = doc(db, "groups", name);
  const groupSnap = await getDoc(groupRef);
  if(!groupSnap.exists()) return alert("Grupo no existe");
  if(groupSnap.data().password !== pass) return alert("Clave incorrecta");

  openChat(name, false);
};

// Iniciar chat privado
document.getElementById("startPrivateChat").onclick = () => {
  const otherUser = document.getElementById("privateUserId").value.trim();
  if(!otherUser) return alert("Ingresa ID del usuario");

  const chatId = [username, otherUser].sort().join("_"); // id único
  openChat(chatId, true);
};

// Abrir chat
function openChat(id, privateChat){
  isPrivate = privateChat;
  currentChat = id;
  document.getElementById("system").style.display = "none";
  document.getElementById("chat").style.display = "block";
  document.getElementById("chatUserName").innerText = username;
  document.getElementById("chatGroupName").innerText = privateChat ? `Chat privado` : `Grupo: ${id}`;

  if(!privateChat){
    const linkInput = document.getElementById("groupLink");
    const link = `${window.location.origin}${window.location.pathname}?group=${encodeURIComponent(id)}`;
    linkInput.value = link;
  }else{
    document.getElementById("groupLink").value = "";
  }

  loadMessages();
}

// Enviar mensaje
document.getElementById("sendMessage").onclick = async () => {
  const text = document.getElementById("messageInput").value.trim();
  if(!text) return;

  const col = isPrivate ?
    collection(db, "users", username, "privateChats", currentChat, "messages") :
    collection(db, "groups", currentChat, "messages");

  await addDoc(col, { user: username, text, timestamp: serverTimestamp() });
  document.getElementById("messageInput").value = "";
}

// Compartir grupo
document.getElementById("shareGroup").onclick = () => {
  const linkInput = document.getElementById("groupLink");
  if(!linkInput.value) return;
  linkInput.select();
  document.execCommand("copy");
  alert("Link copiado!");
}

// Volver al sistema
document.getElementById("backSystem").onclick = () => {
  document.getElementById("chat").style.display = "none";
  document.getElementById("system").style.display = "block";
}

// Cargar mensajes en tiempo real
function loadMessages(){
  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  const col = isPrivate ?
    collection(db, "users", username, "privateChats", currentChat, "messages") :
    collection(db, "groups", currentChat, "messages");

  const q = query(col, orderBy("timestamp"));

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

// Prellenar grupo desde link
window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const groupParam = params.get("group");
  if(groupParam) document.getElementById("joinGroupName").value = groupParam;
}
