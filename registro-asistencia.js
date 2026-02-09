import { db } from "./firebase.js";
import { collection, getDocs, addDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const fechaInput = document.getElementById("fecha");
const aulaSelect = document.getElementById("aulaSelect");
const cargarAlumnosBtn = document.getElementById("cargarAlumnos");
const tablaAlumnos = document.querySelector("#tablaAlumnos tbody");

// Cargar aulas
async function cargarAulas() {
  const data = await getDocs(collection(db, "aulas"));
  aulaSelect.innerHTML = '<option value="">Seleccionar aula</option>';
  data.forEach(a => {
    aulaSelect.innerHTML += `<option value="${a.data().nombre}">${a.data().nombre}</option>`;
  });
}
cargarAulas();

// Cargar alumnos por aula
cargarAlumnosBtn.onclick = async () => {
  if (!fechaInput.value || !aulaSelect.value) return alert("Seleccione fecha y aula");
  tablaAlumnos.innerHTML = "";

  const alumnosData = await getDocs(collection(db, "alumnos"));
  const alumnosFiltrados = alumnosData.docs.filter(al => al.data().aula === aulaSelect.value);

  for (const al of alumnosFiltrados) {
    // Verificar si ya tiene registro en esa fecha
    const q = query(collection(db, "asistencias"), where("alumno", "==", al.id), where("fecha", "==", fechaInput.value));
    const existing = await getDocs(q);
    const marcado = existing.docs.length > 0 ? existing.docs[0].data().presente : false;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${al.data().nombre}</td>
      <td><input type="checkbox" data-id="${al.id}" ${marcado ? 'checked' : ''}></td>
      <td><button data-id="${al.id}">Guardar</button></td>
    `;

    // Guardar asistencia
    tr.querySelector("button").onclick = async () => {
      const presente = tr.querySelector("input").checked;

      if (existing.docs.length > 0) {
        // Ya existe, actualizar
        await existing.docs[0].ref.update({ presente });
        alert("Asistencia actualizada");
      } else {
        await addDoc(collection(db, "asistencias"), {
          alumno: al.id,
          nombre: al.data().nombre,
          aula: al.data().aula,
          fecha: fechaInput.value,
          presente
        });
        alert("Asistencia registrada");
      }
    };

    tablaAlumnos.appendChild(tr);
  }
};
