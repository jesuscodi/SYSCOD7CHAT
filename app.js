import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyXXXX",
  authDomain: "tuchat-dni.firebaseapp.com",
  projectId: "tuchat-dni",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let dni = "", userId = "", currentChatDNI = "";

// Mantener sesión
if (localStorage.getItem("dni")) {
  dni = localStorage.getItem("dni");
  userId = "user_" + dni;
  document.getElementById("loginDiv").style.display = "none";
  document.getElementById("chatSystem").style.display = "flex";
  document.getElementById("inboxDiv").style.display = "block";
  document.getElementById("currentUser").innerText = dni;
  loadInbox();
}

// LOGIN
document.getElementById("loginBtn").onclick = async () => {
  dni = document.getElementById("dniInput").value.trim();
  if (!/^\d{8}$/.test(dni)) return alert("El DNI debe tener 8 dígitos");
  userId = "user_" + dni;
  localStorage.setItem("dni", dni);

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) await setDoc(userRef, { dni: dni });

  document.getElementById("loginDiv").style.display = "none";
  document.getElementById("chatSystem").style.display = "flex";
  document.getElementById("inboxDiv").style.display = "block";
  document.getElementById("currentUser").innerText = dni;

  loadInbox();
};

// Iniciar chat
document.getElementById("startChat").onclick = async () => {
  const otherDNI = document.getElementById("chatWithDNI").value.trim();
  if (!/^\d{8}$/.test(otherDNI)) return alert("DNI inválido");

  currentChatDNI = otherDNI;
  localStorage.setItem("lastChat", currentChatDNI);
  loadMessages();
};

// Enviar mensaje
document.getElementById("sendMessage").onclick = async () => {
  const text = document.getElementById("messageInput").value.trim();
  if (!text || !currentChatDNI) return;

  await addDoc(collection(db, "messages"), {
    from: dni,
    to: currentChatDNI,
    text,
    timestamp: serverTimestamp()
  });

  document.getElementById("messageInput").value = "";
};

// Cargar mensajes
function loadMessages() {
  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  const messagesCol = collection(db, "messages");
  const q = query(messagesCol, orderBy("timestamp"));

  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      if ((msg.from === dni && msg.to === currentChatDNI) || (msg.from === currentChatDNI && msg.to === dni)) {
        const div = document.createElement("div");
        div.classList.add("message", msg.from === dni ? "me" : "other");
        const time = msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString() : "";
        div.innerHTML = `<b>${msg.from}</b>: ${msg.text} <small>${time}</small>`;
        messagesDiv.appendChild(div);
      }
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// Cargar inbox
function loadInbox() {
  const inboxList = document.getElementById("inboxList");
  inboxList.innerHTML = "";

  const messagesCol = collection(db, "messages");
  onSnapshot(messagesCol, snapshot => {
    const inboxMap = new Map();
    snapshot.forEach(doc => {
      const msg = doc.data();
      if (msg.to === dni) {
        inboxMap.set(msg.from, { lastMsg: msg.text, timestamp: msg.timestamp });
      }
    });

    inboxList.innerHTML = "";
    inboxMap.forEach((value, key) => {
      const div = document.createElement("div");
      div.classList.add("message", "other");
      div.innerHTML = `<b>${key}</b>: ${value.lastMsg} 
        <button class="btnOpenChat">Abrir chat</button>`;
      inboxList.appendChild(div);
    });

    document.querySelectorAll(".btnOpenChat").forEach((btn, index) => {
      btn.onclick = () => {
        const selectedDNI = Array.from(inboxMap.keys())[index];
        document.getElementById("chatWithDNI").value = selectedDNI;
        document.getElementById("startChat").click();
      };
    });
  });
}

// Restaurar último chat
if (localStorage.getItem("lastChat")) {
  currentChatDNI = localStorage.getItem("lastChat");
  document.getElementById("chatWithDNI").value = currentChatDNI;
  loadMessages();
}
