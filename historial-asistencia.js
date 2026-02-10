import { db } from "./firebase.js";
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Esperar a que el HTML cargue
setTimeout(() => {

  const fechaInput = document.getElementById("fecha");
  const aulaSelect = document.getElementById("aulaSelect");
  const filtrarBtn = document.getElementById("filtrar");
  const tablaHistorial = document.querySelector("#tablaHistorial tbody");

 let alumnosSeleccionados = [];

  // ================= CARGAR AULAS =================
 async function cargarAulas() {
    aulaSelect.innerHTML = '<option value="">Seleccionar aula</option>';
    const data = await getDocs(collection(db, "aulas"));

    data.forEach(a => {
      aulaSelect.innerHTML += `
        <option value="${a.data().nombre}">
          ${a.data().nombre}
        </option>
      `;
    });
  }

  // ================= CARGAR HISTORIAL =================
  async function cargarHistorial() {
    tablaHistorial.innerHTML = "";

    const data = await getDocs(collection(db, "asistencias"));

    data.forEach(as => {
      const d = as.data();

      // Filtrar por fecha y aula
      if (
        (fecha.value && d.fecha !== fecha.value) ||
        (aulaSelect.value && d.aula !== aulaSelect.value)
      ) return;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.fecha}</td>
        <td>${d.nombre}</td>
        <td>${d.aula}</td>
        <td><input type="checkbox" ${d.presente ? "checked" : ""}></td>
        <td><button>Actualizar</button></td>
      `;

      // ================= ACTUALIZAR =================
      tr.querySelector("button").onclick = async () => {
        const presente = tr.querySelector("input").checked;
        await updateDoc(doc(db, "asistencias", as.id), { presente });
        alert("Registro actualizado ✅");
      };

      tablaHistorial.appendChild(tr);
    });
  }

  // ================= EVENTOS =================
  filtrarBtn.onclick = cargarHistorial;
  filtroFecha.addEventListener("change", cargarHistorial);
  filtroAula.addEventListener("change", cargarHistorial);

  // ================= INICIAL =================
  cargarAulas();
  cargarHistorial();

}, 100);
