import { db } from "./firebase.js";
import { collection, getDocs, addDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const fechaInput = document.getElementById("fecha");
const listaAlumnos = document.querySelector("#listaAlumnos tbody");
const historial = document.querySelector("#historial tbody");
const cargarBtn = document.getElementById("cargar");

// Cargar alumnos para marcar asistencia
cargarBtn.onclick = async () => {
  if(!fechaInput.value) return alert("Seleccione una fecha");
  listaAlumnos.innerHTML = "";
  const data = await getDocs(collection(db, "alumnos"));
  data.forEach(al => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${al.data().nombre}</td>
      <td>${al.data().aula}</td>
      <td><input type="checkbox" data-id="${al.id}"></td>
      <td><button data-id="${al.id}">Guardar</button></td>
    `;
    // Guardar asistencia de un alumno
    tr.querySelector("button").onclick = async () => {
      const presente = tr.querySelector("input").checked;
      await addDoc(collection(db, "asistencias"), {
        alumno: al.id,
        nombre: al.data().nombre,
        aula: al.data().aula,
        fecha: fechaInput.value,
        presente: presente
      });
      
      alert("Asistencia registrada");
      cargarHistorial();
    };
    listaAlumnos.appendChild(tr);
  });
};

// Cargar historial de asistencias
async function cargarHistorial() {
  historial.innerHTML = "";
  
  const data = await getDocs(collection(db, "asistencias"));
  data.forEach(as => {
      console.log(as.data());  // 👈 AQUI
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${as.data().fecha}</td>
      <td>${as.data().nombre}</td>
      <td>${as.data().aula}</td>
      <td><input type="checkbox" data-id="${as.id}" ${as.data().presente ? 'checked' : ''}></td>
      <td><button data-id="${as.id}">Actualizar</button></td>
    `;
    // Actualizar asistencia
    tr.querySelector("button").onclick = async () => {
      const presente = tr.querySelector("input").checked;
      await updateDoc(doc(db, "asistencias", as.id), { presente });
      alert("Asistencia actualizada");
      cargarHistorial();
    };
    historial.appendChild(tr);
  });
}

// Inicial
cargarHistorial();
