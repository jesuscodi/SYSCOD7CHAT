import { db } from "./firebase.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const filtroFecha = document.getElementById("filtroFecha");
const filtroAula = document.getElementById("filtroAula");
const filtrarBtn = document.getElementById("filtrar");
const tablaHistorial = document.querySelector("#tablaHistorial tbody");

// Cargar aulas
async function cargarAulas() {
  const data = await getDocs(collection(db, "aulas"));
  filtroAula.innerHTML = '<option value="">Todas las aulas</option>';
  data.forEach(a => {
    filtroAula.innerHTML += `<option value="${a.data().nombre}">${a.data().nombre}</option>`;
  });
}
cargarAulas();

// Cargar historial
async function cargarHistorial() {
  tablaHistorial.innerHTML = "";
  const data = await getDocs(collection(db, "asistencias"));
  data.forEach(as => {
    const d = as.data();
    // Filtrar
    if ((filtroFecha.value && d.fecha !== filtroFecha.value) ||
        (filtroAula.value && d.aula !== filtroAula.value)) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.fecha}</td>
      <td>${d.nombre}</td>
      <td>${d.aula}</td>
      <td><input type="checkbox" data-id="${as.id}" ${d.presente ? 'checked' : ''}></td>
      <td><button data-id="${as.id}">Actualizar</button></td>
    `;

    // Actualizar
    tr.querySelector("button").onclick = async () => {
      const presente = tr.querySelector("input").checked;
      await updateDoc(doc(db, "asistencias", as.id), { presente });
      alert("Registro actualizado");
    };

    tablaHistorial.appendChild(tr);
  });
}

// Filtrar
filtrarBtn.onclick = cargarHistorial;

// Inicial
cargarHistorial();
