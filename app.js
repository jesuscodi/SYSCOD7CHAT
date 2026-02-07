import { db } from "./firebase.js";
import { collection, getDocs, addDoc, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const fechaInput = document.getElementById("fecha");
const tabla = document.querySelector("#tablaAsistencia tbody");
const historial = document.querySelector("#historial tbody");
const cargarBtn = document.getElementById("cargar");
const aulaFiltro = document.getElementById("filtroAula"); // select para filtrar por aula

// Cargar aulas en el filtro
async function cargarAulas() {
  const data = await getDocs(collection(db, "aulas"));
  aulaFiltro.innerHTML = '<option value="">Todas las aulas</option>';
  data.forEach(a => {
    aulaFiltro.innerHTML += `<option value="${a.data().nombre}">${a.data().nombre}</option>`;
  });
}

// Cargar alumnos para marcar asistencia
cargarBtn.onclick = async () => {
  if (!fechaInput.value) return alert("Seleccione una fecha");
  tabla.innerHTML = "";

  let alumnosQuery = collection(db, "alumnos");
  if (aulaFiltro.value) {
    alumnosQuery = query(collection(db, "alumnos"), where("aula", "==", aulaFiltro.value));
  }

  const data = await getDocs(alumnosQuery);
  data.forEach(al => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${al.data().nombre}</td>
      <td>${al.data().edad} años</td>
      <td>${al.data().aula}</td>
      <td><input type="checkbox" data-id="${al.id}"></td>
      <td><button data-id="${al.id}">Guardar</button></td>
    `;
    // Guardar asistencia
    tr.querySelector("button").onclick = async () => {
      const presente = tr.querySelector("input").checked;
      await addDoc(collection(db, "asistencias"), {
        alumno: al.id,
        nombre: al.data().nombre,
        edad: al.data().edad,
        aula: al.data().aula,
        fecha: fechaInput.value,
        presente
      });
      alert("Asistencia registrada");
      cargarHistorial();
    };
    tabla.appendChild(tr);
  });
};

// Cargar historial de asistencias
async function cargarHistorial() {
  historial.innerHTML = "";
  const data = await getDocs(collection(db, "asistencias"));
  data.forEach(as => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${as.data().fecha}</td>
      <td>${as.data().nombre}</td>
      <td>${as.data().edad} años</td>
      <td>${as.data().aula}</td>
      <td><input type="checkbox" data-id="${as.id}" ${as.data().presente ? "checked" : ""}></td>
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
await cargarAulas();
cargarHistorial();
