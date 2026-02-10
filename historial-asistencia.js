import { db } from "./firebase.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Esperar a que el HTML dinámico exista
setTimeout(iniciar, 100);

function iniciar() {
  const filtroFecha = document.getElementById("filtroFecha");
  const filtroAula = document.getElementById("aula");
  const filtrarBtn = document.getElementById("filtrar");
  const tablaHistorial = document.querySelector("#tablaHistorial tbody");

  if (!filtroAula) {
    console.error("No existe filtroAula");
    return;
  }

  // ================= CARGAR AULAS =================
  async function cargarAulas() {
    filtroAula.innerHTML = '<option value="">Todas las aulas</option>';

    const data = await getDocs(collection(db, "aulas"));

    if (data.empty) {
      console.warn("No hay aulas registradas");
      return;
    }

    data.forEach(a => {
      filtroAula.innerHTML += `
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

      if ((filtroFecha.value && d.fecha !== filtroFecha.value) ||
          (filtroAula.value && d.aula !== filtroAula.value)) return;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.fecha}</td>
        <td>${d.nombre}</td>
        <td>${d.aula}</td>
        <td><input type="checkbox" ${d.presente ? "checked" : ""}></td>
        <td><button>Actualizar</button></td>
      `;

      tr.querySelector("button").onclick = async () => {
        const presente = tr.querySelector("input").checked;
        await updateDoc(doc(db, "asistencias", as.id), { presente });
        alert("Registro actualizado");
      };

      tablaHistorial.appendChild(tr);
    });
  }

  // Eventos
  filtrarBtn.onclick = cargarHistorial;

  // Inicial
  cargarAulas();
  cargarHistorial();
}
