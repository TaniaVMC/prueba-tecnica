/* =========================================
   ÍCONOS (se usan en el HTML que genera JavaScript)
   ========================================= */
const ICON_CHEVRON = `<svg class="icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="currentColor" d="M9.31 6.71a.996.996 0 0 0 0 1.41L13.19 12l-3.88 3.88a.996.996 0 1 0 1.41 1.41l4.59-4.59a.996.996 0 0 0 0-1.41L10.72 6.7c-.38-.38-1.02-.38-1.41.01"/></svg>`;
const ICON_EMAIL = `<img class="icon" src="assets/icons/correo-electronico.png" alt="">`;
const ICON_PHONE = `<img class="icon" src="assets/icons/mensaje-de-telefono.png" alt="">`;


/* =========================================
   0. UTILIDADES
   ========================================= */

// "Bob Smith" → "BS"
function getInitials(name) {
  return name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

// Quita acentos y mayúsculas: "Pérez" → "perez" (búsqueda flexible)
function normalize(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Convierte una persona en el texto que se copia al portapapeles
function cardToText(person) {
  return `${person.name}\n${person.role} · ${person.company}\n${person.email}\n${person.phone}`;
}


/* =========================================
   1. NAVEGACIÓN ENTRE VISTAS
   ========================================= */
const sections = document.querySelectorAll("main > section");
const tabs = document.querySelectorAll(".tab");

function showView(viewId) {
  // Muestra solo la sección elegida
  sections.forEach(section => {
    section.hidden = section.id !== viewId;
  });

  // El detalle pertenece a la pestaña "Contactos"
  const activeTab = viewId === "view-detail" ? "view-contacts" : viewId;

  tabs.forEach(tab => {
    const isActive = tab.dataset.view === activeTab;
    tab.classList.toggle("is-active", isActive);
    // aria-current indica a los lectores de pantalla en qué pestaña estás
    if (isActive) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });

  window.scrollTo(0, 0);
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => showView(tab.dataset.view));
});


/* =========================================
   2. TOAST + COPIAR DATOS
   ========================================= */
const toast = document.getElementById("toast");
let toastTimer;

function showToast(message) {
  toast.hidden = false;
  toast.textContent = message;
  // Si se toca dos veces seguidas, reinicia el contador
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3000); // 3 segundos
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch (error) {
    // Estado de error: si el navegador no permite copiar
    showToast("No pudimos copiar los datos. Intenta de nuevo.");
  }
}

document.getElementById("copy-btn").addEventListener("click", () => {
  copyText(cardToText(myCard), "✓ Datos copiados. Pégalos en WhatsApp o correo.");
});


/* =========================================
   3. LISTA DE CONTACTOS + BÚSQUEDA
   ========================================= */
const list = document.getElementById("contact-list");
const countEl = document.getElementById("contacts-count");
const noResults = document.getElementById("no-results");
const searchInput = document.getElementById("search-input");
const searchTerm = document.getElementById("search-term");
const clearBtn = document.getElementById("clear-search");
const searchClearBtn = document.getElementById("search-clear");

// Dibuja las filas a partir de un arreglo de contactos
function renderContacts(items) {
  list.innerHTML = "";
  items.forEach(contact => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button type="button" class="contact-item" data-id="${contact.id}"
              aria-label="Ver detalle de ${contact.name}, ${contact.role} en ${contact.company}">
        <span class="avatar avatar--small" aria-hidden="true">${getInitials(contact.name)}</span>
        <span class="contact-text" aria-hidden="true">
          <span class="contact-name">${contact.name}</span>
          <span class="contact-meta"><strong>${contact.role}</strong> ${contact.company}</span>
        </span>
        <span class="chevron" aria-hidden="true">${ICON_CHEVRON}</span>
      </button>`;
    list.appendChild(li);
  });
}

// Filtra según lo escrito y decide qué estado mostrar
function updateList() {
  const query = searchInput.value.trim();
  const q = normalize(query);

  // Busca en nombre, cargo y empresa a la vez
  const results = contacts.filter(contact =>
    normalize(`${contact.name} ${contact.role} ${contact.company}`).includes(q)
  );

  renderContacts(results);

  const hasResults = results.length > 0;
  list.hidden = !hasResults;
  noResults.hidden = hasResults;
  searchTerm.textContent = query;
  countEl.textContent = hasResults
    ? `${results.length} ${results.length === 1 ? "contacto" : "contactos"}`
    : "0 resultados";

  // La ✕ del buscador solo aparece si hay texto
  searchClearBtn.hidden = query === "";
}

function clearSearch() {
  searchInput.value = "";
  updateList();
  searchInput.focus(); // deja el cursor listo para buscar de nuevo
}

// "input" se dispara con cada letra: búsqueda en vivo
searchInput.addEventListener("input", updateList);
clearBtn.addEventListener("click", clearSearch);        // botón "Limpiar búsqueda"
searchClearBtn.addEventListener("click", clearSearch);  // ✕ dentro del buscador


/* =========================================
   4. DETALLE DE CONTACTO
   ========================================= */
const detailCard = document.getElementById("detail-card");
const backBtn = document.getElementById("back-btn");
let lastOpened = null; // para regresar el foco a la fila que se abrió

function openDetail(id) {
  const contact = contacts.find(c => c.id === id);

  detailCard.innerHTML = `
    <div class="avatar" aria-hidden="true">${getInitials(contact.name)}</div>
    <h2 class="card-name" id="detail-name">${contact.name}</h2>
    <p class="card-role">${contact.role}</p>
    <p class="card-company">${contact.company}</p>
    <ul class="card-info">
      <li>${ICON_EMAIL} ${contact.email}</li>
      <li>${ICON_PHONE} ${contact.phone}</li>
    </ul>
    <button type="button" class="btn-primary" id="copy-detail-btn">Copiar datos</button>`;

  document.getElementById("copy-detail-btn").addEventListener("click", () => {
    copyText(cardToText(contact), `✓ Datos de ${contact.name} copiados.`);
  });

  showView("view-detail");
  backBtn.focus(); // al abrir, el foco va al botón de regresar
}

// Un solo "escuchador" para toda la lista (delegación de eventos)
list.addEventListener("click", event => {
  const button = event.target.closest(".contact-item");
  if (!button) return;
  lastOpened = button;
  openDetail(Number(button.dataset.id));
});

backBtn.addEventListener("click", () => {
  showView("view-contacts");
  if (lastOpened) lastOpened.focus(); // regresa a la fila donde estabas
});


/* =========================================
   5. INICIO
   ========================================= */
updateList(); // dibuja la lista al cargar la página