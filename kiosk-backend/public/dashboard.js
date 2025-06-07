// dashboard.js – Admin-Zugriff und Session-Check

// Adresse des Backends
// Backend und Frontend laufen auf derselben Domain
const BACKEND_URL = "";

async function checkUserAndRole() {
  try {
    // Erst prüfen, ob eine gültige Session existiert
    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include'
    });
    const { loggedIn } = await meRes.json();

    if (!meRes.ok || !loggedIn) {
      window.location.href = 'index.html';
      return;
    }

    // Danach Benutzerdaten laden
    const res = await fetch(`${BACKEND_URL}/api/user`, { credentials: 'include' });
    const user = await res.json();

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
