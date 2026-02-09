import { db } from "./firebase.js";
import { collection, getDocs, addDoc, setDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const fechaInput = document.getElementById("fecha");
const aulaSelect = document.getElementById("aulaSelect");
const cargarAlumnosBtn = document.getElementById("cargarAlumnos");
const tablaAlumnos = document.querySelector("#tablaAlumnos tbody");
const guardarBtn = document.getElementById("guardarAsistencia");

let alumnosSeleccionados = []; // Lista de alumnos que cargamos

// Cargar aulas
async function cargarAulas() {
  const data = await getDocs(collection(db, "aulas"));
  aulaSelect.innerHTML = '<option value="">Seleccionar aula</option>';
  data.forEach(a => {
    aulaSelect.innerHTML += `<option value="${a.data().nombre}">${a.data().nombre}</option>`;
  });
}
cargarAulas();

// Cargar alumnos del aula seleccionada
cargarAlumnosBtn.onclick = async () => {
  if (!fechaInput.value || !aulaSelect.value) {
    return alert("Seleccione fecha y aula");
  }

  tablaAlumnos.innerHTML = "";
  alumnosSeleccionados = [];

  const alumnosData = await getDocs(collection(db, "alumnos"));
  const filtrados = alumnosData.docs.filter(al => al.data().aula === aulaSelect.value);

  filtrados.forEach(al => {
    alumnosSeleccionados.push({ id: al.id, nombre: al.data().nombre });
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${al.data().nombre}</td>
      <td><input type="checkbox" data-id="${al.id}"></td>
    `;
    tablaAlumnos.appendChild(tr);
  });
};

// Guardar asistencia
guardarBtn.onclick = async () => {
  if (!fechaInput.value || !aulaSelect.value) {
    return alert("Seleccione fecha y aula antes de guardar");
  }

  const checkboxes = document.querySelectorAll("#tablaAlumnos input[type=checkbox]");

  for (const cb of checkboxes) {
    const alumnoId = cb.dataset.id;
    const alumno = alumnosSeleccionados.find(a => a.id === alumnoId);
    const presente = cb.checked;

    const docId = `${fechaInput.value}_${alumnoId}`; // ID único por alumno y fecha
    await setDoc(doc(db, "asistencias", docId), {
      alumno: alumnoId,
      nombre: alumno.nombre,
      aula: aulaSelect.value,
      fecha: fechaInput.value,
      presente
    }, { merge: true });
  }

  alert("Asistencia registrada correctamente");
};
