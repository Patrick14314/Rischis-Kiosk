// dashboard.js – Admin-Zugriff und Session-Check

// Das Backend befindet sich auf derselben Domain wie das Frontend,
// daher reicht ein leerer Prefix für die API-Routen.
const BACKEND_URL = "";

async function checkUserAndRole() {
  try {
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
