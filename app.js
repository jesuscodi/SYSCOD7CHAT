import { db } from "./firebase.js";
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const dynamicContent = document.getElementById("dynamicContent"); // Div donde cargamos contenido

// --- Función para cargar contenido dinámico ---
export async function loadContent(url, initFunc) {
  const res = await fetch(url);
  dynamicContent.innerHTML = await res.text();
  initFunc(); // Inicializa la lógica del contenido después de cargar el HTML
}

// ================= ALUMNOS =================
export async function initAlumnos() {
  const nombre = document.getElementById("nombre");
  const edad = document.getElementById("edad");
  const aulaSelect = document.getElementById("aula");
  const guardarBtn = document.getElementById("guardar");
  const listaAlumnos = document.querySelector("#listaAlumnos tbody");

  let editId = null;

  // Cargar aulas en select
  async function cargarAulas() {
    const data = await getDocs(collection(db, "aulas"));
    aulaSelect.innerHTML = '<option value="">Seleccionar aula</option>';
    data.forEach(a => {
      aulaSelect.innerHTML += `<option value="${a.data().nombre}">${a.data().nombre}</option>`;
    });
  }

  // Guardar alumno
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

  // Cargar alumnos en tabla
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

  // Inicial
  await cargarAulas();
  await cargarAlumnos();
}

// ================= AULAS =================
export async function initAulas() {
  const nombreAula = document.getElementById("nombreAula");
  const guardarBtn = document.getElementById("guardarAula");
  const listaAulas = document.querySelector("#listaAulas tbody");

  let editId = null;

  // Guardar aula
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

  // Cargar aulas
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

// ================= ASISTENCIA =================
export async function initAsistencia() {
  const fechaInput = document.getElementById("fecha");
  const listaAlumnos = document.querySelector("#listaAlumnos tbody");
  const historial = document.querySelector("#historial tbody");
  const cargarBtn = document.getElementById("cargar");

  cargarBtn.onclick = async () => {
    if(!fechaInput.value) return alert("Seleccione una fecha");
    listaAlumnos.innerHTML = "";

    const data = await getDocs(collection(db, "alumnos"));
    data.forEach(al => {
      const tr = document.createElement("tr");
      const idAsistencia = `${fechaInput.value}_${al.id}`; // ID único

      tr.innerHTML = `
        <td>${al.data().nombre}</td>
        <td>${al.data().aula}</td>
        <td><input type="checkbox" data-id="${idAsistencia}"></td>
        <td><button data-id="${idAsistencia}">Guardar</button></td>
      `;

      tr.querySelector("button").onclick = async () => {
        const presente = tr.querySelector("input").checked;
        await setDoc(doc(db, "asistencias", idAsistencia), {
          alumno: al.id,
          nombre: al.data().nombre,
          aula: al.data().aula,
          fecha: fechaInput.value,
          presente
        }, { merge: true });
        cargarHistorial();
      };

      listaAlumnos.appendChild(tr);
    });

    cargarHistorial();
  };

  async function cargarHistorial() {
    historial.innerHTML = "";
    if(!fechaInput.value) return;

    const q = query(collection(db, "asistencias"), where("fecha", "==", fechaInput.value));
    const data = await getDocs(q);

    data.forEach(as => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${as.data().fecha}</td>
        <td>${as.data().nombre}</td>
        <td>${as.data().aula}</td>
        <td><input type="checkbox" data-id="${as.id}" ${as.data().presente ? 'checked' : ''}></td>
        <td><button data-id="${as.id}">Actualizar</button></td>
      `;
      tr.querySelector("button").onclick = async () => {
        const presente = tr.querySelector("input").checked;
        await updateDoc(doc(db, "asistencias", as.id), { presente });
        cargarHistorial();
      };
      historial.appendChild(tr);
    });
  }

  fechaInput.addEventListener("change", cargarHistorial);
}
