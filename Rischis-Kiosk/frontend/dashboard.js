// dashboard.js – Session-Check mit optionaler Admin-Logik
const BACKEND_URL = location.hostname.includes('localhost') ? 'http://localhost:3000' : '';

// Session prüfen (über /auth/me)
async function checkSessionAndRole() {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });

    const result = await res.json();

    if (!result.loggedIn || !result.user) {
      window.location.href = 'index.html';
      return;
    }

    // Zeige Begrüßung
    document.getElementById('welcome')!.textContent = `Willkommen, ${result.user.email}`;

    // Falls du zusätzliche Rollenprüfung brauchst:
    const userRes = await fetch(`${BACKEND_URL}/api/user`, { credentials: 'include' });
    const userInfo = await userRes.json();

    if (userInfo.role === 'admin') {
      document.getElementById('admin-btn')?.classList.remove('hidden');
    }
  } catch (err) {
    console.error("Fehler beim Session-/Rollencheck:", err);
    window.location.href = 'index.html';
  }
}

// Darkmode beibehalten
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}
if (localStorage.getItem('darkMode') !== 'false') {
  document.documentElement.classList.add('dark');
}

// Start
window.addEventListener('DOMContentLoaded', checkSessionAndRole);
