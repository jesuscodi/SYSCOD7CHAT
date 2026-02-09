import { db } from "./firebase.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const filtroFecha = document.getElementById("filtroFecha");
const filtroAula = document.getElementById("filtroAula");
const filtrarBtn = document.getElementById("filtrar");
const tablaHistorial = document.querySelector("#tablaHistorial tbody");

// --- Cargar aulas en el select ---
async function cargarAulas() {
  if (!filtroAula) return; // Si el select no existe aún
  const data = await getDocs(collection(db, "aulas"));
  filtroAula.innerHTML = '<option value="">Todas las aulas</option>';
  data.forEach(a => {
    filtroAula.innerHTML += `<option value="${a.data().nombre}">${a.data().nombre}</option>`;
  });
}

// --- Cargar historial ---
async function cargarHistorial() {
  tablaHistorial.innerHTML = "";
  const data = await getDocs(collection(db, "asistencias"));
  data.forEach(as => {
    const d = as.data();

    // Filtrar por fecha y aula
    if ((filtroFecha.value && d.fecha !== filtroFecha.value) ||
        (filtroAula.value && d.aula !== filtroAula.value)) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.fecha}</td>
      <td>${d.nombre}</td>
      <td>${d.aula}</td>
      <td><input type="checkbox" data-id="${as.id}" ${d.presente ? 'checked' : ''}></td>
      <td><button class="update-btn" data-id="${as.id}"><i class="fa fa-sync-alt"></i> Actualizar</button></td>
    `;

    // Botón actualizar
    tr.querySelector("button").onclick = async () => {
      const presente = tr.querySelector("input").checked;
      await updateDoc(doc(db, "asistencias", as.id), { presente });
      alert("Registro actualizado");
    };

    tablaHistorial.appendChild(tr);
  });
}

// --- Filtrar ---
filtrarBtn.onclick = cargarHistorial;

// --- Inicial ---
cargarAulas().then(cargarHistorial);
