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
<div class="alumnos-container">
  <h2>Gestionar Alumnos</h2>

  <div class="alumnos-form-table">
    <!-- Formulario -->
    <div class="alumnos-form">
      <h3>Registrar Alumno</h3>
      <input type="text" id="nombre" placeholder="Nombre alumno">
      <input type="number" id="edad" placeholder="Edad" min="3" max="18">
      <select id="aula">
        <option value="">Seleccionar aula</option>
      </select>
      <button id="guardar">Guardar</button>
    </div>

    <!-- Tabla -->
    <div class="alumnos-table">
      <h3>Lista de alumnos registrados</h3>
      <table id="listaAlumnos">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Edad</th>
            <th>Aula</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
</div>

<script type="module">
import { db } from "./firebase.js";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Guardar alumno (nuevo o editar)
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
    alert("Alumno actualizado");
  } else {
    await addDoc(collection(db, "alumnos"), {
      nombre: nombre.value,
      edad: parseInt(edad.value),
      aula: aulaSelect.value
    });
    alert("Alumno registrado");
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

    // Editar
    tr.querySelector(".editar").onclick = () => {
      nombre.value = docu.data().nombre;
      edad.value = docu.data().edad;
      aulaSelect.value = docu.data().aula;
      editId = docu.id;
      guardarBtn.textContent = "Actualizar";
    };

    // Eliminar
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
cargarAulas();
cargarAlumnos();
</script>

<style>
/* Contenedor general */
.alumnos-container {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

/* Flex para formulario y tabla */
.alumnos-form-table {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

/* Formulario */
.alumnos-form {
  flex: 1;
  min-width: 280px;
  background: #fff3e0;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 8px 15px rgba(0,0,0,0.1);
}

.alumnos-form h3 {
  margin-bottom: 15px;
  color: #ff6f61;
}

.alumnos-form input, .alumnos-form select, .alumnos-form button {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 10px;
  border-radius: 10px;
  border: 2px solid #ffb347;
  outline: none;
  transition: 0.3s;
}

.alumnos-form input:focus, .alumnos-form select:focus {
  border-color: #ff6f61;
  box-shadow: 0 0 6px rgba(255,111,97,0.3);
}

.alumnos-form button {
  background: linear-gradient(90deg, #ff6f61, #ffb347);
  border: none;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.3s;
}

.alumnos-form button:hover {
  transform: scale(1.05);
}

/* Tabla */
.alumnos-table {
  flex: 2;
  min-width: 300px;
  overflow-x: auto;
}

.alumnos-table h3 {
  margin-bottom: 10px;
  color: #ff6f61;
}

.alumnos-table table {
  width: 100%;
  border-collapse: collapse;
  background: #fff3e0;
  border-radius: 10px;
  overflow: hidden;
}

.alumnos-table th, .alumnos-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ffdab9;
}

.alumnos-table th {
  background: #ffb347;
  color: white;
}

.alumnos-table td button {
  margin-right: 5px;
  padding: 5px 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: white;
  font-size: 0.9rem;
}

.alumnos-table td .editar {
  background: #ff6f61;
}

.alumnos-table td .eliminar {
  background: #ff9f43;
}

.alumnos-table td button:hover {
  opacity: 0.85;
}

/* Responsive */
@media(max-width: 768px) {
  .alumnos-form-table {
    flex-direction: column;
  }
}
</style>
