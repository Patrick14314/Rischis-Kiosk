// dashboard.js – Admin-Zugriff und Session-Check

// Backend-URL auf die Hosting-Domain setzen, damit Login und Dashboard
// gegen denselben Server laufen: https://rischis-kiosk-hdoi.onrender.com
// So wird das Cookie korrekt mitgeschickt.
const BACKEND_URL = "https://rischis-kiosk-hdoi.onrender.com";

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
