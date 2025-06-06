// index.js – Login und Registrierung via Backend statt direkter Supabase-Nutzung

const BACKEND_URL = "https://rischis-kiosk.onrender.com";

function showMessage(text, success = false) {
  const message = document.getElementById('message');
  message.textContent = text;
  message.className = success ? 'text-green-600 mt-4 text-center' : 'text-red-500 mt-4 text-center';
  message.classList.remove('hidden');
  setTimeout(() => message.classList.add('hidden'), 5000);
}

function switchForm(mode) {
  const isLogin = mode === 'login';
  document.getElementById('login-form').classList.toggle('hidden', !isLogin);
  document.getElementById('register-form').classList.toggle('hidden', isLogin);
  document.getElementById('message').classList.add('hidden');
}

// Darkmode-Handling
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}
if (localStorage.getItem('darkMode') !== 'false') {
  document.documentElement.classList.add('dark');
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const remember = document.getElementById('remember-me').checked;

  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, remember })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login fehlgeschlagen');

    showMessage("Login erfolgreich! Weiterleitung...", true);
    
    // Supabase Session setzen
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('sb-access-token='))
      ?.split('=')[1];

    if (token) {
      const supabase = window.supabase.createClient(
        "https://izkuiqjhzeeirmcikbef.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      );
      await supabase.auth.setSession({ access_token: token, refresh_token: "" });
    }

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  } catch (err) {
    showMessage(err.message || 'Fehler beim Login');
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const repeat = document.getElementById('register-password-repeat').value;

  if (password !== repeat) return showMessage("Passwörter stimmen nicht überein.");

  try {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Registrierung fehlgeschlagen');

    showMessage("Registrierung erfolgreich! Bitte jetzt einloggen.", true);
    switchForm('login');
  } catch (err) {
    showMessage(err.message || 'Fehler bei Registrierung');
  }
});
