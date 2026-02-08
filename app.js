import { db } from "./firebase.js";
import { collection, getDocs, addDoc, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const fechaInput = document.getElementById("fecha");
const tabla = document.querySelector("#tablaAsistencia tbody");
const historial = document.querySelector("#historial tbody");
const cargarBtn = document.getElementById("cargar");

// Cargar alumnos en tabla de asistencia
cargarBtn.onclick = async () => {
  tabla.innerHTML = "";
  const data = await getDocs(collection(db, "alumnos"));
  data.forEach(al => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${al.data().nombre}</td>
      <td>${al.data().aula}</td>
      <td><input type="checkbox" data-id="${al.id}"></td>
      <td><button data-id="${al.id}">Guardar</button></td>
    `;
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
    tabla.appendChild(tr);
  });
};

// Cargar historial
async function cargarHistorial() {
  historial.innerHTML = "";
  const data = await getDocs(collection(db, "asistencias"));
  data.forEach(as => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${as.data().fecha}</td>
      <td>${as.data().nombre}</td>
      <td>${as.data().aula}</td>
      <td><input type="checkbox" data-id="${as.id}" ${as.data().presente ? 'checked' : ''}></td>
      <td><button data-id="${as.id}">Actualizar</button></td>
    `;
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
