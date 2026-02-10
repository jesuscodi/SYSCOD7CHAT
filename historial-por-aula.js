import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Esperar a que el HTML cargue
setTimeout(() => {

  const filtroAula = document.getElementById("filtroAula");
  const filtroFecha = document.getElementById("filtroFecha");
  const filtrarBtn = document.getElementById("filtrar");
  const tablaHistorial = document.querySelector("#tablaHistorial tbody");

  // ================= CARGAR AULAS =================
  async function cargarAulas() {
    filtroAula.innerHTML = '<option value="">Todas las aulas</option>';
    const aulasSnapshot = await getDocs(collection(db, "aulas"));

    aulasSnapshot.forEach(aula => {
      filtroAula.innerHTML += `<option value="${aula.data().nombre}">${aula.data().nombre}</option>`;
    });
  }

  // ================= CARGAR HISTORIAL POR AULA =================
  async function cargarHistorial() {
    tablaHistorial.innerHTML = "";

    const asistenciasSnapshot = await getDocs(collection(db, "asistencias"));

    asistenciasSnapshot.forEach(asistencia => {
      const d = asistencia.data();

      // Filtrar por aula y fecha
      if ((filtroAula.value && d.aula !== filtroAula.value) ||
          (filtroFecha.value && d.fecha !== filtroFecha.value)) return;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.fecha}</td>
        <td>${d.aula}</td>
        <td>${d.nombre}</td>
        <td>${d.presente ? "✅ Presente" : "❌ Ausente"}</td>
      `;

      tablaHistorial.appendChild(tr);
    });
  }

  // ================= EVENTOS =================
  filtrarBtn.onclick = cargarHistorial;
  filtroAula.addEventListener("change", cargarHistorial);
  filtroFecha.addEventListener("change", cargarHistorial);

  // ================= INICIAL =================
  cargarAulas();
  cargarHistorial();

}, 100);
