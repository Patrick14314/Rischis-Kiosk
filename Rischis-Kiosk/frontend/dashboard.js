// dashboard.js – Admin-Zugriff und Session-Check

// Backend-URL auf localhost setzen, damit Login und Dashboard
// gegen denselben Server laufen. Sonst wird das Cookie nicht
// mitgeschickt und der User wirkt sofort ausgeloggt.
const BACKEND_URL = "http://localhost:3000";

async function checkUserAndRole() {
  console.log('🟡 Dashboard: Usercheck startet');
  try {
    const res = await fetch(`${BACKEND_URL}/api/user`, { credentials: 'include' });
    const user = await res.json();
  console.log('🟢 Status:', res.status);
  console.log('🧾 Antwort:', user);

    if (!user?.id) {
      window.location.href = 'index.html';
      return;
    }

    if (user.role === 'admin') {
      document.getElementById('admin-btn')?.classList.remove('hidden');
    }
  } catch (err) {
    console.error("Fehler beim Laden des Nutzers", err);
    window.location.href = 'index.html';
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}

if (localStorage.getItem('darkMode') !== 'false') {
  document.documentElement.classList.add('dark');
}

window.addEventListener('DOMContentLoaded', checkUserAndRole);
