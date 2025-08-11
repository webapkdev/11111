
function updateMenuForRole() {
  const raw = localStorage.getItem('apk_user');
  const devBtn = document.getElementById('devConsoleBtn');
  const adminBtn = document.getElementById('adminConsoleBtn');
  const profileLink = document.getElementById('profileLink');
  const logoutBtn = document.getElementById('logoutBtn');
  if (!raw) {
    if (devBtn) devBtn.style.display = 'none';
    if (adminBtn) adminBtn.style.display = 'none';
    if (profileLink) profileLink.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
  } else {
    const user = JSON.parse(raw);
    if (devBtn) devBtn.style.display = (user.role === 'developer' || user.role === 'admin') ? 'block' : 'none';
    if (adminBtn) adminBtn.style.display = (user.role === 'admin') ? 'block' : 'none';
    if (profileLink) profileLink.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'block';
  }
}

// script.js - shared frontend logic (search, menus, app loading)

document.addEventListener("DOMContentLoaded", () => {
  updateMenuForRole();
  // UI elements
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsMenu = document.getElementById("settingsMenu");
  const profileLink = document.getElementById("profileLink");
  const devConsoleBtn = document.getElementById("devConsoleBtn");
  const adminConsoleBtn = document.getElementById("adminConsoleBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const searchInput = document.getElementById("searchInput");

  // Show/hide settings menu
  if (settingsBtn && settingsMenu) {
    settingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      settingsMenu.style.display = settingsMenu.style.display === "block" ? "none" : "block";
    });

    // close menu when clicking outside
    document.addEventListener("click", () => {
      if (settingsMenu) settingsMenu.style.display = "none";
    });

    // prevent click inside menu from closing when interacting
    settingsMenu.addEventListener("click", (e) => e.stopPropagation());
  }

  // quick navigation buttons
  if (devConsoleBtn) devConsoleBtn.addEventListener("click", () => location.href = "/developer.html");
  if (adminConsoleBtn) adminConsoleBtn.addEventListener("click", () => location.href = "/admin.html");
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("apk_user");
    location.href = "/index.html";
  });

  // search
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      if (typeof filterApps === "function") filterApps(q);
    });
  }

  // initial load of public apps on index
  if (document.getElementById("appGrid")) {
    loadApps();
  }
});

// load all approved apps
async function loadApps() {
  try {
    const res = await fetch("/apps");
    const apps = await res.json();
    if (!Array.isArray(apps) || apps.length === 0) {
      document.getElementById("noApps").style.display = "block";
    } else {
      document.getElementById("noApps").style.display = "none";
    }
    renderApps(apps);
  } catch (err) {
    console.error("Failed to load apps", err);
    document.getElementById("noApps").style.display = "block";
  }
}

function renderApps(apps) {
  const grid = document.getElementById("appGrid");
  if (!grid) return;
  grid.innerHTML = "";
  apps.forEach(a => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${a.icon}" alt="${a.appName}">
      <h3>${escapeHtml(a.appName)}</h3>
      <p>${escapeHtml(a.description)}</p>
      <div style="display:flex;gap:8px;margin-top:10px">
        <a class="btn" href="${a.apk}" download>Download</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

// filter apps used by search
function filterApps(q) {
  const list = document.querySelectorAll("#appGrid .card");
  if (!list) return;
  if (!q) {
    // show all
    list.forEach(n => n.style.display = "");
    return;
  }
  list.forEach(card => {
    const text = (card.innerText || "").toLowerCase();
    card.style.display = text.includes(q) ? "" : "none";
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

// convenience: upload file to backend endpoints /upload/icon and /upload/apk
async function uploadFile(type) {
  const fileInput = document.getElementById(type === 'icon' ? 'iconFile' : 'apkFile');
  if (!fileInput || !fileInput.files.length) {
    alert('Please select a file first.');
    return;
  }
  const file = fileInput.files[0];
  const fd = new FormData();
  fd.append('file', file);
  const endpoint = type === 'icon' ? '/upload/icon' : '/upload/apk';
  try {
    const resp = await fetch(endpoint, { method: 'POST', body: fd });
    const j = await resp.json();
    if (j.success) {
      alert(`${type.toUpperCase()} uploaded: ${j.url}`);
    } else {
      alert('Upload error: ' + (j.error || JSON.stringify(j)));
    }
  } catch (err) {
    console.error(err);
    alert('Upload failed');
  }
}
