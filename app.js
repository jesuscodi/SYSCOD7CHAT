import { db } from "./firebase.js";
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const dynamicContent = document.getElementById("dynamicContent"); // Div donde cargamos contenido

// --- Función para cargar contenido dinámico ---
export async function loadContent(url, initFunc) {
  const res = await fetch(url);
  dynamicContent.innerHTML = await res.text();
  initFunc();
}

// ================= ALUMNOS =================
export async function initAlumnos() {
  const nombre = document.getElementById("nombre");
  const edad = document.getElementById("edad");
  const aulaSelect = document.getElementById("aula");
  const guardarBtn = document.getElementById("guardar");
  const listaAlumnos = document.querySelector("#listaAlumnos tbody");

  let editId = null;

  async function cargarAulas() {
    const data = await getDocs(collection(db, "aulas"));
    aulaSelect.innerHTML = '<option value="">Seleccionar aula</option>';
    data.forEach(a => {
      aulaSelect.innerHTML += `<option value="${a.data().nombre}">${a.data().nombre}</option>`;
    });
  }

  guardarBtn.onclick = async () => {
    if(!nombre.value.trim() || !edad.value || !aulaSelect.value) return alert("Complete todos los campos");

    if(editId) {
      await updateDoc(doc(db, "alumnos", editId), {
        nombre: nombre.value,
        edad: parseInt(edad.value),
        aula: aulaSelect.value
      });
      editId = null;
      guardarBtn.textContent = "Guardar";
    } else {
      await addDoc(collection(db, "alumnos"), {
        nombre: nombre.value,
        edad: parseInt(edad.value),
        aula: aulaSelect.value
      });
    }

    nombre.value = "";
    edad.value = "";
    aulaSelect.value = "";
    cargarAlumnos();
  };

  async function cargarAlumnos() {
    listaAlumnos.innerHTML = "";
    const data = await getDocs(collection(db, "alumnos"));
    data.forEach(docu => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${docu.data().nombre}</td>
        <td>${docu.data().edad}</td>
        <td>${docu.data().aula}</td>
        <td>
          <button class="editar">Editar</button>
          <button class="eliminar">Eliminar</button>
        </td>
      `;
      tr.querySelector(".editar").onclick = () => {
        nombre.value = docu.data().nombre;
        edad.value = docu.data().edad;
        aulaSelect.value = docu.data().aula;
        editId = docu.id;
        guardarBtn.textContent = "Actualizar";
      };
      tr.querySelector(".eliminar").onclick = async () => {
        if(confirm(`¿Eliminar a ${docu.data().nombre}?`)) {
          await deleteDoc(doc(db, "alumnos", docu.id));
          cargarAlumnos();
        }
      };
      listaAlumnos.appendChild(tr);
    });
  }

  await cargarAulas();
  await cargarAlumnos();
}

// ================= AULAS =================
export async function initAulas() {
  const nombreAula = document.getElementById("nombreAula");
  const guardarBtn = document.getElementById("guardarAula");
  const listaAulas = document.querySelector("#listaAulas tbody");

  let editId = null;

  guardarBtn.onclick = async () => {
    if(!nombreAula.value.trim()) return alert("Ingrese un nombre de aula");

    if(editId) {
      await updateDoc(doc(db, "aulas", editId), { nombre: nombreAula.value });
      editId = null;
      guardarBtn.textContent = "Guardar";
    } else {
      await addDoc(collection(db, "aulas"), { nombre: nombreAula.value });
    }

    nombreAula.value = "";
    cargarAulas();
  };

  async function cargarAulas() {
    listaAulas.innerHTML = "";
    const data = await getDocs(collection(db, "aulas"));
    data.forEach(docu => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${docu.data().nombre}</td>
        <td>
          <button class="editar">Editar</button>
          <button class="eliminar">Eliminar</button>
        </td>
      `;
      tr.querySelector(".editar").onclick = () => {
        nombreAula.value = docu.data().nombre;
        editId = docu.id;
        guardarBtn.textContent = "Actualizar";
      };
      tr.querySelector(".eliminar").onclick = async () => {
        if(confirm(`¿Eliminar el aula ${docu.data().nombre}?`)) {
          await deleteDoc(doc(db, "aulas", docu.id));
          cargarAulas();
        }
      };
      listaAulas.appendChild(tr);
    });
  }

  cargarAulas();
}

// ================= ASISTENCIA (ARREGLADO) =================
export async function initAsistencia() {
  const fechaInput = document.getElementById("fecha");
  const aulaSelect = document.getElementById("aulaSelect");
  const cargarAlumnosBtn = document.getElementById("cargarAlumnos");
  const tablaAlumnos = document.querySelector("#tablaAlumnos tbody");

  if (!fechaInput) return;

  // Cargar aulas
  const dataAulas = await getDocs(collection(db, "aulas"));
  aulaSelect.innerHTML = '<option value="">Seleccionar aula</option>';
  dataAulas.forEach(a => {
    aulaSelect.innerHTML += `<option value="${a.data().nombre}">${a.data().nombre}</option>`;
  });

  // Cargar alumnos
  cargarAlumnosBtn.onclick = async () => {
    if (!fechaInput.value || !aulaSelect.value) {
      return alert("Seleccione fecha y aula");
    }

    tablaAlumnos.innerHTML = "";

    const alumnosData = await getDocs(collection(db, "alumnos"));
    const alumnosFiltrados = alumnosData.docs.filter(
      al => al.data().aula === aulaSelect.value
    );

    for (const al of alumnosFiltrados) {
      const idAsistencia = `${fechaInput.value}_${al.id}`;
      const ref = doc(db, "asistencias", idAsistencia);

      // Verificar si ya existe
      const existente = await getDocs(
        query(
          collection(db, "asistencias"),
          where("fecha", "==", fechaInput.value),
          where("alumno", "==", al.id)
        )
      );

      let marcado = false;
      if (existente.docs.length > 0) {
        marcado = existente.docs[0].data().presente;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${al.data().nombre}</td>
        <td><input type="checkbox" ${marcado ? "checked" : ""}></td>
        <td><button>Guardar</button></td>
      `;

      tr.querySelector("button").onclick = async () => {
        const presente = tr.querySelector("input").checked;

        await setDoc(ref, {
          alumno: al.id,
          nombre: al.data().nombre,
          aula: al.data().aula,
          fecha: fechaInput.value,
          presente
        }, { merge: true });

        alert("Asistencia guardada");
      };

      tablaAlumnos.appendChild(tr);
    }
  };
}
// ================= HISTORIAL DE ASISTENCIAS =================
export async function initHistorial() {
  const filtroAula = document.getElementById("filtroAula");
  const filtroFecha = document.getElementById("filtroFecha");
  const filtrarBtn = document.getElementById("filtrar");
  const tablaHistorial = document.querySelector("#tablaHistorial tbody");

  // Cargar aulas
  async function cargarAulas() {
    filtroAula.innerHTML = '<option value="">Todas las aulas</option>';
    const aulasSnapshot = await getDocs(collection(db, "aulas"));
    aulasSnapshot.forEach(aula => {
      filtroAula.innerHTML += `<option value="${aula.data().nombre}">${aula.data().nombre}</option>`;
    });
  }

  // Cargar historial
  async function cargarHistorial() {
    tablaHistorial.innerHTML = "";
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
  }

  // Eventos
  filtrarBtn.onclick = cargarHistorial;
  filtroAula.addEventListener("change", cargarHistorial);
  filtroFecha.addEventListener("change", cargarHistorial);

  // Inicial
  cargarAulas();
  cargarHistorial();
}
