import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, setDoc } 
from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// 🔹 Configura Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAOSY1Ju8T5jexXSRsnZhHvsUZU0vvyixc",
  authDomain: " syscod7-d1753.firebaseapp.com",
  projectId: "syscod7-d1753",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let username = "";
let userId = "";
let currentChat = "";
let isPrivate = false;

// Generar ID único
function generateUserId(name){
  return name + "_" + Math.floor(Math.random()*10000);
}

// Entrar al sistema
document.getElementById("enterSystem").onclick = async () => {
  let nameInput = document.getElementById("usernameInput").value.trim();
  if(!nameInput) return alert("Ingresa tu nombre");

  if(localStorage.getItem("userId") && localStorage.getItem("username")) {
    userId = localStorage.getItem("userId");
    username = localStorage.getItem("username");
  } else {
    userId = generateUserId(nameInput);
    username = nameInput;
    try {
      await setDoc(doc(db, "users", userId), { name: username });
      localStorage.setItem("userId", userId);
      localStorage.setItem("username", username);
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      return alert("Error al ingresar. Revisa tu conexión o Firebase.");
    }
  }

  document.getElementById("login").style.display = "none";
  document.getElementById("system").style.display = "block";
  document.getElementById("userName").innerText = username;
  document.getElementById("userIdDisplay").innerText = `Tu ID: ${userId}`;

  loadPrivateChats();
};

// MODALES
const modalCreate = document.getElementById("modalCreate");
const modalJoin = document.getElementById("modalJoin");
const btnCreateGroup = document.getElementById("btnCreateGroup");
const btnJoinGroup = document.getElementById("btnJoinGroup");
const closeCreate = document.getElementById("closeCreate");
const closeJoin = document.getElementById("closeJoin");

btnCreateGroup.onclick = () => modalCreate.style.display = "block";
btnJoinGroup.onclick = () => modalJoin.style.display = "block";
closeCreate.onclick = () => modalCreate.style.display = "none";
closeJoin.onclick = () => modalJoin.style.display = "none";
window.onclick = (e) => {
  if(e.target==modalCreate) modalCreate.style.display="none";
  if(e.target==modalJoin) modalJoin.style.display="none";
}

// Crear grupo
document.getElementById("createGroup").onclick = async () => {
  const name = document.getElementById("newGroupName").value.trim();
  const pass = document.getElementById("newGroupPassword").value.trim();
  if(!name || !pass) return alert("Completa los campos");
  const groupRef = doc(db,"groups",name);
  const groupSnap = await getDoc(groupRef);
  if(groupSnap.exists()) return alert("Grupo ya existe");
  await setDoc(groupRef,{password:pass});
  modalCreate.style.display="none";
  openChat(name,false);
};

// Unirse a grupo
document.getElementById("joinGroup").onclick = async () => {
  const name = document.getElementById("joinGroupName").value.trim();
  const pass = document.getElementById("joinGroupPassword").value.trim();
  if(!name || !pass) return alert("Completa los campos");
  const groupRef = doc(db,"groups",name);
  const groupSnap = await getDoc(groupRef);
  if(!groupSnap.exists()) return alert("Grupo no existe");
  if(groupSnap.data().password!==pass) return alert("Clave incorrecta");
  modalJoin.style.display="none";
  openChat(name,false);
};

// Iniciar chat privado
document.getElementById("startPrivateChat").onclick = async () => {
  const otherId = document.getElementById("privateUserId").value.trim();
  if(!otherId) return alert("Ingresa el ID del usuario");
  const userSnap = await getDoc(doc(db,"users",otherId));
  if(!userSnap.exists()) return alert("Usuario no existe");
  const chatId = [userId,otherId].sort().join("_");
  openChat(chatId,true);
};

// Abrir chat
function openChat(id,privateChat){
  isPrivate=privateChat;
  currentChat=id;
  document.getElementById("system").style.display="none";
  document.getElementById("chat").style.display="block";
  document.getElementById("chatUserName").innerText=username;
  document.getElementById("chatGroupName").innerText=privateChat?`Chat privado`:`Grupo: ${id}`;
  document.getElementById("groupLink").value = privateChat?"":`${window.location.origin}${window.location.pathname}?group=${encodeURIComponent(id)}`;
  loadMessages();
}

// Enviar mensaje
document.getElementById("sendMessage").onclick=async()=>{
  const text=document.getElementById("messageInput").value.trim();
  if(!text) return;
  const col = isPrivate?
    collection(db,"users",userId,"privateChats",currentChat,"messages"):
    collection(db,"groups",currentChat,"messages");
  await addDoc(col,{user:username,text,timestamp:serverTimestamp()});
  document.getElementById("messageInput").value="";
}

// Compartir grupo
document.getElementById("shareGroup").onclick=()=>{
  const linkInput=document.getElementById("groupLink");
  if(!linkInput.value) return;
  linkInput.select();
  document.execCommand("copy");
  alert("Link copiado!");
}

// Volver al sistema
document.getElementById("backSystem").onclick=()=>{
  document.getElementById("chat").style.display="none";
  document.getElementById("system").style.display="block";
}

// Cargar mensajes en tiempo real
function loadMessages(){
  const messagesDiv=document.getElementById("messages");
  messagesDiv.innerHTML="";
  const col=isPrivate?
    collection(db,"users",userId,"privateChats",currentChat,"messages"):
    collection(db,"groups",currentChat,"messages");
  const q=query(col,orderBy("timestamp"));
  onSnapshot(q,snapshot=>{
    messagesDiv.innerHTML="";
    snapshot.forEach(doc=>{
      const msg=doc.data();
      const div=document.createElement("div");
      div.classList.add("message");
      div.classList.add(msg.user===username?"me":"other");
      const time=msg.timestamp?new Date(msg.timestamp.seconds*1000).toLocaleTimeString():"";
      div.innerHTML=`<b>${msg.user}:</b> ${msg.text} <small>${time}</small>`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop=messagesDiv.scrollHeight;
  });
}

// BANDEJA DE CHATS PRIVADOS
const privateChatsDiv=document.getElementById("privateChatsList");
function loadPrivateChats(){
  privateChatsDiv.innerHTML="";
  const userChatsCol=collection(db,"users",userId,"privateChats");
  onSnapshot(userChatsCol,snapshot=>{
    privateChatsDiv.innerHTML="";
    snapshot.forEach(async chatDoc=>{
      const chatId=chatDoc.id;
      const otherId=chatId.split("_").find(id=>id!==userId);
      const otherSnap=await getDoc(doc(db,"users",otherId));
      const otherName=otherSnap.exists()?otherSnap.data().name:"Desconocido";
      const messagesCol=collection(db,"users",userId,"privateChats",chatId,"messages");
      const lastMsgQuery=query(messagesCol,orderBy("timestamp","desc"));
      onSnapshot(lastMsgQuery,msgSnap=>{
        let lastMsg="",time="";
        msgSnap.forEach(m=>{ const data=m.data(); lastMsg=data.text; time=data.timestamp?new Date(data.timestamp.seconds*1000).toLocaleTimeString():""; });
        const div=document.createElement("div");
        div.classList.add("private-chat-item");
        div.innerHTML=`<b>${otherName}</b>: ${lastMsg} <small>${time}</small>`;
        div.onclick=()=>openChat(chatId,true);
        privateChatsDiv.appendChild(div);
      });
    });
  });
}

// Prellenar grupo desde link
window.onload=()=>{
  const params=new URLSearchParams(window.location.search);
  const groupParam=params.get("group");
  if(groupParam) document.getElementById("joinGroupName").value=groupParam;
}
