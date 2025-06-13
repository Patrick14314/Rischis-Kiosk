// dashboard.js – Admin-Zugriff und Session-Check

// Adresse des Backends
// Backend und Frontend laufen auf derselben Domain
// Einheitliche Definition für alle Frontend-Skripte
const BACKEND_URL = window.location.origin;

const controller = new AbortController();
window.addEventListener('beforeunload', () => controller.abort());

let currentRole = null;
const buttons = [];
let adminButton = null;

async function getCsrfToken() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/csrf-token`, {
      credentials: 'include',
      signal: controller.signal,
    });
    const data = await res.json();
    return data.csrfToken;
  } catch (err) {
    console.error('CSRF-Token konnte nicht geladen werden', err);
    return null;
  }
}

async function checkUserAndRole(retries = 6) {
  try {
    // Erst prüfen, ob eine gültige Session existiert
    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
      credentials: 'include',
      signal: controller.signal,
    });
    const { loggedIn } = await meRes.json();

    if (!meRes.ok || !loggedIn) {
      if (retries > 0) {
        setTimeout(() => checkUserAndRole(retries - 1), 500);
        return;
      }
      window.location.href = 'index.html';
      return;
    }

    // Danach Benutzerdaten laden
    const res = await fetch(`${BACKEND_URL}/api/user`, {
      credentials: 'include',
      signal: controller.signal,
    });
    const user = await res.json();

    if (!user?.id) {
      window.location.href = 'index.html';
      return;
    }

    currentRole = user.role;
    adminButton = document.getElementById('admin-btn');
    if (user.role === 'admin') {
      adminButton?.classList.remove('hidden');
    }
    setupActivation();
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error('Fehler beim Laden des Nutzers', err);
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

async function logout() {
  try {
    const token = await getCsrfToken();
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-csrf-token': token },
      signal: controller.signal,
    });
  } catch (err) {
    console.error('Fehler beim Logout', err);
  } finally {
    window.location.href = 'index.html';
  }
}

function setupButtons() {
  buttons.push(
    document.getElementById('kiosk-btn'),
    document.getElementById('buzzer-btn'),
    document.getElementById('mentos-btn')
  );
  adminButton = document.getElementById('admin-btn');
  if (adminButton) buttons.push(adminButton);
  buttons.forEach((btn) => {
    if (!btn) return;
    btn.classList.add('disabled-link');
    btn.addEventListener('click', (e) => {
      if (btn.classList.contains('disabled-link')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  });
}

function disableButtons() {
  document.getElementById('loader').classList.remove('hidden');
  buttons.forEach((btn) => btn?.classList.add('disabled-link'));
}

function enableButtons() {
  document.getElementById('loader').classList.add('hidden');
  buttons.forEach((btn) => btn?.classList.remove('disabled-link'));
}

function setupActivation() {
  if (currentRole === 'admin') {
    const observer = new MutationObserver(() => {
      if (adminButton && adminButton.offsetParent !== null) {
        observer.disconnect();
        enableButtons();
      }
    });
    if (adminButton && adminButton.offsetParent !== null) {
      enableButtons();
    } else {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  } else {
    setTimeout(enableButtons, 2000);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setupButtons();
  disableButtons();
  checkUserAndRole();
});
