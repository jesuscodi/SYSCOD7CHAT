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
  const fechaNacimiento = document.getElementById("fechaNacimiento"); // ✅ Añadido input fecha
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
  if (!nombre.value.trim() || !edad.value || !aulaSelect.value || !fechaNacimiento.value) {
    return alert("Complete todos los campos");
  }

  // ✅ Convertir correctamente la fecha de nacimiento
  const nacimientoParts = fechaNacimiento.value.split("-"); // "YYYY-MM-DD"
  const nacimiento = new Date(nacimientoParts[0], nacimientoParts[1] - 1, nacimientoParts[2]);

  const hoy = new Date();
  let edadCalculada = hoy.getFullYear() - nacimiento.getFullYear();
  const mesDiff = hoy.getMonth() - nacimiento.getMonth();
  const diaDiff = hoy.getDate() - nacimiento.getDate();

  if (mesDiff < 0 || (mesDiff === 0 && diaDiff < 0)) {
    edadCalculada--;
  }

  // ✅ Validar que la edad ingresada coincida
  if (parseInt(edad.value) !== edadCalculada) {
    return alert(`❌ La edad ingresada no coincide con la fecha de nacimiento.\nEdad correcta: ${edadCalculada}`);
  }

  if (editId) {
    await updateDoc(doc(db, "alumnos", editId), {
      nombre: nombre.value,
      edad: parseInt(edad.value),
      aula: aulaSelect.value,
      fechaNacimiento: fechaNacimiento.value
    });
    editId = null;
    guardarBtn.textContent = "Guardar";
    alert("✅ Alumno actualizado correctamente");
  } else {
    await addDoc(collection(db, "alumnos"), {
      nombre: nombre.value,
      edad: parseInt(edad.value),
      aula: aulaSelect.value,
      fechaNacimiento: fechaNacimiento.value
    });
    alert("✅ Alumno registrado correctamente");
  }

  // Limpiar campos
  nombre.value = "";
  edad.value = "";
  aulaSelect.value = "";
  fechaNacimiento.value = "";
  cargarAlumnos();
};



  // Cargar alumnos en la tabla
  async function cargarAlumnos() {
    listaAlumnos.innerHTML = "";
    const data = await getDocs(collection(db, "alumnos"));
    data.forEach(docu => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${docu.data().nombre}</td>
        <td>${docu.data().edad}</td>
        <td>${docu.data().aula}</td>
        <td>${docu.data().fechaNacimiento || ""}</td> <!-- ✅ mostrar fecha -->
        <td>
          <button class="editar">Editar</button>
          <button class="eliminar">Eliminar</button>
        </td>
      `;

      // Editar alumno
      tr.querySelector(".editar").onclick = () => {
        nombre.value = docu.data().nombre;
        edad.value = docu.data().edad;
        aulaSelect.value = docu.data().aula;
        fechaNacimiento.value = docu.data().fechaNacimiento || ""; // ✅ llenar fecha al editar
        editId = docu.id;
        guardarBtn.textContent = "Actualizar";
      };

      // Eliminar alumno
      tr.querySelector(".eliminar").onclick = async () => {
        if (confirm(`¿Eliminar a ${docu.data().nombre}?`)) {
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
  const guardarBtn = document.getElementById("guardarAsistencia"); // Botón único abajo
  let alumnosFiltrados = [];

  if (!fechaInput) return;

  // Cargar aulas
  const dataAulas = await getDocs(collection(db, "aulas"));
  aulaSelect.innerHTML = '<option value="">Seleccionar aula</option>';
  dataAulas.forEach(a => {
    aulaSelect.innerHTML += `<option value="${a.data().nombre}">${a.data().nombre}</option>`;
  });

  // Cargar alumnos al hacer click
  cargarAlumnosBtn.onclick = async () => {
    if (!fechaInput.value || !aulaSelect.value) {
      return alert("Seleccione fecha y aula");
    }

    tablaAlumnos.innerHTML = "";
    const alumnosData = await getDocs(collection(db, "alumnos"));
    alumnosFiltrados = alumnosData.docs.filter(al => al.data().aula === aulaSelect.value);

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

      const marcado = existente.docs.length > 0 ? existente.docs[0].data().presente : false;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${al.data().nombre}</td>
        <td><input type="checkbox" data-id="${al.id}" ${marcado ? "checked" : ""}></td>
      `;

      tablaAlumnos.appendChild(tr);
    }
  };

  // Guardar asistencia para todos los checkboxes con un solo botón
  guardarBtn.onclick = async () => {
    if (!fechaInput.value || !aulaSelect.value) {
      return alert("Seleccione fecha y aula antes de guardar");
    }

    const checkboxes = tablaAlumnos.querySelectorAll("input[type=checkbox]");

    for (const cb of checkboxes) {
      const alumnoId = cb.dataset.id;
      const alumno = alumnosFiltrados.find(a => a.id === alumnoId);
      const presente = cb.checked;
      const docId = `${fechaInput.value}_${alumnoId}`;

      await setDoc(doc(db, "asistencias", docId), {
        alumno: alumnoId,
        nombre: alumno.data().nombre,
        aula: aulaSelect.value,
        fecha: fechaInput.value,
        presente
      }, { merge: true });
    }

    document.getElementById("mensaje").textContent = "✅ Asistencia registrada correctamente";
  };
}
///////////////////DASHBOARD CUMPLEAÑOS//////////////////////

// Función para mostrar cumpleaños del mes
export async function mostrarCumpleMes() {
    const container = document.getElementById("cumpleMesContainer");
    const tabla = document.getElementById("tablaCumpleMes");
    const tbody = tabla.querySelector("tbody");

    container.innerHTML = "";
    tbody.innerHTML = "";

    const mesActual = new Date().getMonth() + 1;

    const dataAlumnos = await getDocs(collection(db, "alumnos"));
    const cumpleMes = dataAlumnos.docs.filter(al => {
        const fecha = al.data().fechaNacimiento;
        if (!fecha) return false;
        const mes = parseInt(fecha.split("-")[1]);
        return mes === mesActual;
    });

    if (cumpleMes.length === 0) {
        container.innerHTML = "<p>No hay cumpleaños este mes 🎉</p>";
        return;
    }

    // Mostrar tarjetas
    cumpleMes.forEach(al => {
        const fecha = al.data().fechaNacimiento;
        const nacimiento = new Date(fecha);
        const hoy = new Date();
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        if (hoy.getMonth() < nacimiento.getMonth() ||
            (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }

        const card = document.createElement("div");
        card.className = "cumple-card";
        card.innerHTML = `
          <h3>${al.data().nombre}</h3>
          <p>Aula: ${al.data().aula}</p>
          <p>Fecha: ${fecha}</p>
          <p>🎂 Cumple ${edad} años</p>
        `;
        container.appendChild(card);

        // Agregar a la tabla
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${al.data().nombre}</td>
          <td>${al.data().aula}</td>
          <td>${fecha}</td>
          <td>${edad}</td>
        `;
        tbody.appendChild(tr);
    });

    tabla.style.display = "table"; // Mostrar tabla
}

// ================= HISTORIAL =================
export async function initHistorial() {
  await cargarAulasFiltro();
  await cargarHistorial();
// --- Botón descargar Excel ---
const btnDescargar = document.getElementById("descargarExcel");
if (btnDescargar) {
  btnDescargar.onclick = () => {
    const tbody = document.querySelector("#tablaHistorial tbody");
    if (!tbody) return alert("No hay datos para descargar");

    let csv = "Fecha,Aula,Alumno,Presente\n";
    tbody.querySelectorAll("tr").forEach(tr => {
      const cols = tr.querySelectorAll("td");
      const row = [
        cols[0].innerText,
        cols[1].innerText,
        cols[2].innerText,
        cols[3].innerText
      ].join(",");
      csv += row + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historial_asistencias_${Date.now()}.csv`;
    link.click();
  };
}

  const btnFiltrar = document.getElementById("filtrar");
  if (btnFiltrar) {
    btnFiltrar.onclick = async () => {
      await cargarHistorial();
    };
  }
}

// Cargar aulas en el select
async function cargarAulasFiltro() {
  const select = document.getElementById("filtroAula");
  if (!select) return;

  select.innerHTML = `<option value="">Todas las aulas</option>`;

  const data = await getDocs(collection(db, "aulas"));
  data.forEach(a => {
    select.innerHTML += `<option value="${a.data().nombre}">${a.data().nombre}</option>`;
  });
}

// Cargar historial
async function cargarHistorial() {
  const tbody = document.querySelector("#tablaHistorial tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const aula = document.getElementById("filtroAula")?.value || "";
  const fecha = document.getElementById("filtroFecha")?.value || "";

  let ref = collection(db, "asistencias");
  let q = ref;

  // aplicar filtros dinámicos
  if (aula && fecha) {
    q = query(ref, where("aula", "==", aula), where("fecha", "==", fecha));
  } else if (aula) {
    q = query(ref, where("aula", "==", aula));
  } else if (fecha) {
    q = query(ref, where("fecha", "==", fecha));
  }

  const data = await getDocs(q);

  if (data.empty) {
    tbody.innerHTML = `<tr><td colspan="4">No hay registros</td></tr>`;
    return;
  }

  data.forEach(as => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${as.data().fecha}</td>
      <td>${as.data().aula}</td>
      <td>${as.data().nombre}</td>
      <td>${as.data().presente ? "✅" : "❌"}</td>
    `;
    tbody.appendChild(tr);
  });
}
