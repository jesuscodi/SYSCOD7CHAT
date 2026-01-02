import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAOSY1Ju8T5jexXSRsnZhHvsUZU0vvyixc",
  authDomain: " syscod7-d1753.firebaseapp.com ",
  projectId: "syscod7-d1753",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let dni = "", userId = "", currentChat = "";

// LOGIN con validación de 9 dígitos
document.getElementById("loginBtn").onclick = async () => {
  dni = document.getElementById("dniInput").value.trim();
  if (!/^\d{9}$/.test(dni)) return alert("El DNI debe tener 9 dígitos");

  userId = "user_" + dni;

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) await setDoc(userRef, { dni: dni });

  document.getElementById("loginDiv").style.display = "none";
  document.getElementById("chatSystem").style.display = "flex";
  document.getElementById("inboxDiv").style.display = "block";

  loadInbox();
};

// Iniciar chat con otro DNI
document.getElementById("startChat").onclick = async () => {
  const otherDNI = document.getElementById("chatWithDNI").value.trim();
  if (!/^\d{9}$/.test(otherDNI)) return alert("El DNI del otro usuario debe tener 9 dígitos");

  const otherId = "user_" + otherDNI;
  const otherSnap = await getDoc(doc(db, "users", otherId));
  if (!otherSnap.exists()) return alert("El otro usuario no existe");

  currentChat = [userId, otherId].sort().join("_");

  loadMessages();
};

// Enviar mensaje
document.getElementById("sendMessage").onclick = async () => {
  const text = document.getElementById("messageInput").value.trim();
  if (!text) return;

  const messagesCol = collection(db, "privateChats", currentChat, "messages");
  await addDoc(messagesCol, { user: dni, text, timestamp: serverTimestamp() });

  document.getElementById("messageInput").value = "";
};

// Cargar mensajes en tiempo real
function loadMessages() {
  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  const messagesCol = collection(db, "privateChats", currentChat, "messages");
  const q = query(messagesCol, orderBy("timestamp"));
  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement("div");
      div.classList.add("message");
      div.classList.add(msg.user === dni ? "me" : "other");
      const time = msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString() : "";
      div.innerHTML = `<b>${msg.user}:</b> ${msg.text} <small>${time}</small>`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// Cargar inbox de mensajes recibidos
function loadInbox() {
  const inboxList = document.getElementById("inboxList");
  inboxList.innerHTML = "";

  const chatsCol = collection(db, "privateChats");
  onSnapshot(chatsCol, snapshot => {
    inboxList.innerHTML = "";
    snapshot.forEach(chatDoc => {
      const chatId = chatDoc.id;
      if (chatId.includes(userId)) {
        const messagesCol = collection(db, "privateChats", chatId, "messages");
        onSnapshot(messagesCol, msgSnap => {
          inboxList.innerHTML = "";
          let counter = 1;
          msgSnap.forEach(doc => {
            const msg = doc.data();
            if (msg.user !== dni) {
              const div = document.createElement("div");
              div.classList.add("message", "other");
              div.innerHTML = `<b>${msg.user}</b>: ${msg.text} <small>Mensaje #${counter}</small>`;
              inboxList.appendChild(div);
              counter++;
            }
          });
        });
      }
    });
  });
}
