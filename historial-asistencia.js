import { db } from "./firebase.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⛔ importante: esperar que el html cargue en el div dinámico
setTimeout(inicializar, 200);

function inicializar() {

  const filtroFecha = document.getElementById("filtroFecha");
  const filtroAula = document.getElementById("filtroAula");
  const filtrarBtn = document.getElementById("filtrar");
  const tablaHistorial = document.querySelector("#tablaHistorial tbody");

  if (!filtroAula) {
    console.error("No existe filtroAula");
    return;
  }

  // ================= CARGAR AULAS =================
  async function cargarAulas() {
    try {
      filtroAula.innerHTML = '<option value="">Todas las aulas</option>';

      const data = await getDocs(collection(db, "aulas"));

      if (data.empty) {
        console.warn("No hay aulas registradas");
        return;
      }

      data.forEach(a => {
        filtroAula.innerHTML += `<option value="${a.data().nombre}">${a.data().nombre}</option>`;
      });

    } catch (error) {
      console.error("Error cargando aulas:", error);
    }
  }

  // ================= CARGAR HISTORIAL =================
  async function cargarHistorial() {
    tablaHistorial.innerHTML = "";

    const data = await getDocs(collection(db, "asistencias"));

    data.forEach(as => {
      const d = as.data();

      if (
        (filtroFecha.value && d.fecha !== filtroFecha.value) ||
        (filtroAula.value && d.aula !== filtroAula.value)
      ) return;

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
        alert("Actualizado ✅");
      };

      tablaHistorial.appendChild(tr);
    });
  }

  filtrarBtn.onclick = cargarHistorial;
  filtroFecha.addEventListener("change", cargarHistorial);
  filtroAula.addEventListener("change", cargarHistorial);

  cargarAulas();
  cargarHistorial();
}
