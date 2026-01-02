import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAOSY1Ju8T5jexXSRsnZhHvsUZU0vvyixc",
  authDomain: "syscod7-d1753.firebaseapp.com",
  projectId: "syscod7-d1753",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let dni = "", userId = "", currentChatDNI = "", currentGroup = "";

// ======== Manejo de sesión ========
if(localStorage.getItem("dni")) {
  dni = localStorage.getItem("dni");
  userId = "user_" + dni;
  document.getElementById("loginDiv").style.display = "none";
  document.getElementById("chatSystem").style.display = "flex";
  document.getElementById("inboxDiv").style.display = "block";
  document.getElementById("userDisplay").innerText = "Usuario: " + dni;
  updateOnlineStatus(true);
  loadInbox();
  loadGroups();
}

// ======== LOGIN ========
document.getElementById("loginBtn").onclick = async () => {
  dni = document.getElementById("dniInput").value.trim();
  if (!/^\d{8}$/.test(dni)) return alert("El DNI debe tener 8 dígitos");

  userId = "user_" + dni;
  localStorage.setItem("dni", dni);

  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, { dni: dni, online: true, lastSeen: null });
  } else {
    await updateDoc(userRef, { online: true });
  }

  document.getElementById("loginDiv").style.display = "none";
  document.getElementById("chatSystem").style.display = "flex";
  document.getElementById("inboxDiv").style.display = "block";
  document.getElementById("userDisplay").innerText = "Usuario: " + dni;

  updateOnlineStatus(true);
  loadInbox();
  loadGroups();
};

// ======== Estado online/última vez ========
async function updateOnlineStatus(online) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    online: online,
    lastSeen: online ? null : serverTimestamp()
  });
}
window.addEventListener("beforeunload", () => { updateOnlineStatus(false); });

// ======== CHAT ========
document.getElementById("startChat").onclick = async () => {
  const otherDNI = document.getElementById("chatWithDNI").value.trim();
  if (!/^\d{8}$/.test(otherDNI)) return alert("El DNI del otro usuario debe tener 8 dígitos");

  currentChatDNI = otherDNI;
  currentGroup = ""; // chat individual
  loadMessages();
};

// ======== Enviar mensaje ========
document.getElementById("sendMessage").onclick = async () => {
  const text = document.getElementById("messageInput").value.trim();
  if (!text || (!currentChatDNI && !currentGroup)) return;

  const data = { from: dni, text, timestamp: serverTimestamp(), emojis: {} };

  if(currentGroup){
    data.toGroup = currentGroup;
    await addDoc(collection(db, "groups", currentGroup, "messages"), data);
  } else {
    data.to = currentChatDNI;
    await addDoc(collection(db, "messages"), data);
  }

  document.getElementById("messageInput").value = "";
};

// ======== Cargar mensajes ========
function loadMessages() {
  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  let messagesCol;
  if(currentGroup){
    messagesCol = collection(db, "groups", currentGroup, "messages");
  } else {
    messagesCol = collection(db, "messages");
  }

  const q = query(messagesCol, orderBy("timestamp"));
  onSnapshot(q, snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const msg = doc.data();
      if(currentGroup || (msg.from === dni && msg.to === currentChatDNI) || (msg.from === currentChatDNI && msg.to === dni)){
        const div = document.createElement("div");
        div.classList.add("message", msg.from === dni ? "me" : "other");
        const time = msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString() : "";
        div.innerHTML = `<b>${msg.from}</b>: ${msg.text} <small>${time}</small>`;

        // Reacciones
        const reactions = document.createElement("div");
        reactions.style.marginTop = "5px";
        for(const [emoji, count] of Object.entries(msg.emojis || {})){
          const btn = document.createElement("button");
          btn.innerText = `${emoji} ${count}`;
          btn.style.marginRight = "5px";
          btn.onclick = async () => {
            const docRef = currentGroup 
              ? doc(db, "groups", currentGroup, "messages", doc.id)
              : doc(db, "messages", doc.id);
            await updateDoc(docRef, { [`emojis.${emoji}`]: (msg.emojis[emoji] || 0) +1 });
          };
          reactions.appendChild(btn);
        }

        const addReactionBtn = document.createElement("button");
        addReactionBtn.innerText = "😊";
        addReactionBtn.onclick = async () => {
          const emoji = prompt("Ingresa emoji a reaccionar");
          if(!emoji) return;
          const docRef = currentGroup 
            ? doc(db, "groups", currentGroup, "messages", doc.id)
            : doc(db, "messages", doc.id);
          await updateDoc(docRef, { [`emojis.${emoji}`]: (msg.emojis[emoji] || 0) +1 });
        };
        reactions.appendChild(addReactionBtn);

        div.appendChild(reactions);
        messagesDiv.appendChild(div);
      }
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

// ======== Inbox ========
function loadInbox() {
  const inboxList = document.getElementById("inboxList");
  inboxList.innerHTML = "";

  const messagesCol = collection(db, "messages");
  onSnapshot(messagesCol, snapshot => {
    const inboxMap = new Map();

    snapshot.forEach(doc => {
      const msg = doc.data();
      if(msg.to === dni){
        inboxMap.set(msg.from, { lastMsg: msg.text, timestamp: msg.timestamp });
      }
    });

    inboxList.innerHTML = "";
    inboxMap.forEach((value, key) => {
      const div = document.createElement("div");
      div.classList.add("message", "other");
      const status = document.createElement("small");
      showUserStatus(key, status);
      div.innerHTML = `<b>${key}</b>: ${value.lastMsg} `;
      div.appendChild(status);
      const btn = document.createElement("button");
      btn.innerText = "Abrir chat";
      btn.classList.add("btnOpenChat");
      btn.onclick = () => {
        document.getElementById("chatWithDNI").value = key;
        document.getElementById("startChat").click();
      };
      div.appendChild(btn);
      inboxList.appendChild(div);
    });
  });
}

// ======== Estado usuarios ========
function showUserStatus(userDNI, container){
  const userRef = doc(db,"users","user_" + userDNI);
  onSnapshot(userRef, snapshot => {
    if(snapshot.exists()){
      const data = snapshot.data();
      container.innerText = data.online ? " - En línea" : ` - Última vez: ${data.lastSeen ? new Date(data.lastSeen.seconds*1000).toLocaleString() : "Desconocido"}`;
    }
  });
}

// ======== Crear grupos ========
document.getElementById("createGroupBtn").onclick = async () => {
  const groupName = document.getElementById("groupNameInput").value.trim();
  const usersText = document.getElementById("groupUsersInput").value.trim();
  if(!groupName || !usersText) return alert("Ingrese nombre y usuarios");

  const users = usersText.split(",").map(u => "user_" + u.trim());
  if(!users.includes(userId)) users.push(userId);

  const groupRef = doc(db, "groups", groupName);
  await setDoc(groupRef, { name: groupName, members: users });

  document.getElementById("groupNameInput").value = "";
  document.getElementById("groupUsersInput").value = "";
  loadGroups();
}

// ======== Listar grupos ========
function loadGroups(){
  const groupsContainer = document.getElementById("groupsContainer");
  groupsContainer.innerHTML = "";

  const groupsCol = collection(db, "groups");
  onSnapshot(groupsCol, snapshot => {
    groupsContainer.innerHTML = "";
    snapshot.forEach(doc => {
      const grp = doc.data();
      if(grp.members.includes(userId)){
        const div = document.createElement("div");
        div.style.margin = "5px 0";
        div.innerHTML = `<b>${grp.name}</b> - <span id="membersStatus"></span> <button class="btnOpenGroup">Abrir</button>`;
        groupsContainer.appendChild(div);

        // Mostrar estado miembros
        const membersStatus = div.querySelector("#membersStatus");
        grp.members.forEach(member => {
          const span = document.createElement("span");
          showUserStatus(member.replace("user_",""), span);
          membersStatus.appendChild(span);
        });
      }
    });

    document.querySelectorAll(".btnOpenGroup").forEach((btn,index)=>{
      btn.onclick = () => {
        const grpName = snapshot.docs[index].id;
        currentGroup = grpName;
        currentChatDNI = "";
        loadMessages();
      }
    });
  });
}
