import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

  const filtroAula = document.getElementById("filtroAula");
  const filtroFecha = document.getElementById("filtroFecha");
  const filtrarBtn = document.getElementById("filtrar");
  const tablaHistorial = document.querySelector("#tablaHistorial tbody");

  // ================= CARGAR AULAS =================
  async function cargarAulas() {
    filtroAula.innerHTML = '<option value="">Todas las aulas</option>';
    try {
      const aulasSnapshot = await getDocs(collection(db, "aulas"));
      aulasSnapshot.forEach(aula => {
        filtroAula.innerHTML += `<option value="${aula.data().nombre}">${aula.data().nombre}</option>`;
      });
    } catch (error) {
      console.error("Error cargando aulas:", error);
      filtroAula.innerHTML = '<option value="">Error al cargar aulas</option>';
    }
  }

  // ================= CARGAR HISTORIAL =================
  async function cargarHistorial() {
    tablaHistorial.innerHTML = "";
    try {
      const asistenciasSnapshot = await getDocs(collection(db, "asistencias"));

      asistenciasSnapshot.forEach(asistencia => {
        const d = asistencia.data();

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

    } catch (error) {
      console.error("Error cargando historial:", error);
      tablaHistorial.innerHTML = `<tr><td colspan="4">Error al cargar historial</td></tr>`;
    }
  }

  // ================= EVENTOS =================
  filtrarBtn.addEventListener("click", cargarHistorial);
  filtroAula.addEventListener("change", cargarHistorial);
  filtroFecha.addEventListener("change", cargarHistorial);

  // ================= INICIAL =================
  await cargarAulas();
  await cargarHistorial();
});
