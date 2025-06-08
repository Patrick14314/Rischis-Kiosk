// Basis-URL des Backends
// Hier wird der Endpunkt genutzt, der auf Render als Backend
// deployt ist. Alle API-Aufrufe des Frontends verwenden diese
// Konstante, damit Frontend und Backend korrekt kommunizieren.
// Backend und Frontend laufen auf derselben Domain
// Einheitliche Definition für alle Frontend-Skripte
const BACKEND_URL = window.location.origin;

let csrfToken;

async function getCsrfToken() {
  if (!csrfToken) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/csrf-token`, {
        credentials: 'include',
      });
      const data = await res.json();
      csrfToken = data.csrfToken;
    } catch (err) {
      console.error('CSRF-Token konnte nicht geladen werden', err);
    }
  }
  return csrfToken;
}

// Meldung anzeigen
function showMessage(text, success = false) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.className = success
    ? 'text-green-600 mt-4 text-center'
    : 'text-red-500 mt-4 text-center';
  message.classList.remove('hidden');
  setTimeout(() => message.classList.add('hidden'), 5000);
}

// Formular-Umschaltung
function switchForm(mode) {
  const isLogin = mode === 'login';
  document.getElementById('login-form').classList.toggle('hidden', !isLogin);
  document.getElementById('register-form').classList.toggle('hidden', isLogin);
  document.getElementById('message').classList.add('hidden');
}

// Darkmode
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}
if (localStorage.getItem('darkMode') !== 'false') {
  document.documentElement.classList.add('dark');
}

// LOGIN
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const token = await getCsrfToken();
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token,
      },
      credentials: 'include', // wichtig für Cookies
      body: JSON.stringify({ email, password })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login fehlgeschlagen');

    showMessage("Login erfolgreich! Weiterleitung...", true);

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  } catch (err) {
    console.error(err);
    showMessage(err.message || 'Fehler beim Login');
  }
});

// REGISTRIERUNG
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const repeat = document.getElementById('register-password-repeat').value;

  if (password !== repeat) return showMessage("Passwörter stimmen nicht überein.");

  try {
    const token = await getCsrfToken();
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token,
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Registrierung fehlgeschlagen');

    showMessage("Registrierung erfolgreich! Bitte jetzt einloggen.", true);
    switchForm('login');
  } catch (err) {
    console.error(err);
    showMessage(err.message || 'Fehler bei Registrierung');
  }
});
