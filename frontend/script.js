// script.js - shared frontend logic (search, menus, app loading)
document.addEventListener("DOMContentLoaded", () => {
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsMenu = document.getElementById("settingsMenu");
  const devConsoleBtn = document.getElementById("devConsoleBtn");
  const adminConsoleBtn = document.getElementById("adminConsoleBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const searchInput = document.getElementById("searchInput");

  if (settingsBtn && settingsMenu) {
    settingsBtn.addEventListener("click", (e) => { e.stopPropagation(); settingsMenu.style.display = settingsMenu.style.display === "block" ? "none" : "block"; });
    document.addEventListener("click", () => { if (settingsMenu) settingsMenu.style.display = "none"; });
    settingsMenu.addEventListener("click", (e)=>e.stopPropagation());
  }

  if (devConsoleBtn) devConsoleBtn.addEventListener("click", () => location.href = "/developer.html");
  if (adminConsoleBtn) adminConsoleBtn.addEventListener("click", () => location.href = "/admin.html");
  if (logoutBtn) logoutBtn.addEventListener("click", () => { localStorage.removeItem("apk_user"); location.href = "/index.html"; });

  if (searchInput) {
    searchInput.addEventListener("input", debounce(function(){ filterApps(this.value.trim().toLowerCase()); }, 200));
  }

  if (document.getElementById("appGrid")) {
    loadApps();
  }
});

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
        <a class="btn" href="${a.apk}" download>Install</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterApps(q) {
  const cards = document.querySelectorAll("#appGrid .card");
  if (!cards) return;
  if (!q) { cards.forEach(c=>c.style.display=''); return; }
  cards.forEach(card => {
    const text = (card.innerText || "").toLowerCase();
    card.style.display = text.includes(q) ? "" : "none";
  });
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function debounce(fn, t){ let timeout; return function(...args){ clearTimeout(timeout); timeout = setTimeout(()=>fn.apply(this,args), t); }; }
