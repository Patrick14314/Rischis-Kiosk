// buzzer.js – einfache Steuerung der Buzzer-Seite

// Basis-URL des Backends - identisch für alle Skripte
const BACKEND_URL = window.location.origin;

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}
if (localStorage.getItem('darkMode') !== 'false') {
  document.documentElement.classList.add('dark');
}

async function checkUser() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/user`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('not auth');
    const user = await res.json();
    return user;
  } catch (err) {
    window.location.href = 'index.html';
    return null;
  }
}

async function loadRound() {
  const res = await fetch(`${BACKEND_URL}/api/buzzer/round`, {
    credentials: 'include',
  });
  const { round } = res.ok ? await res.json() : { round: null };

  const infoEl = document.getElementById('round-info');
  const joinBtn = document.getElementById('join-btn');

  if (round) {
    infoEl.textContent = `Einsatz: ${round.bet} Punkte, Limit: ${round.points_limit}`;
    joinBtn.classList.remove('hidden');
  } else {
    infoEl.textContent = 'Keine laufende Runde';
    joinBtn.classList.add('hidden');
  }
}

async function loadGeneralInfo() {
  const res = await fetch(`${BACKEND_URL}/api/buzzer/info`, {
    credentials: 'include',
  });
  const { sessions: online } = res.ok ? await res.json() : { sessions: [] };
  const container = document.getElementById('general-info');
  container.innerHTML = '';
  online?.forEach((u) => {
    const li = document.createElement('div');
    const color = u.users?.role === 'admin' ? 'text-red-600' : 'text-green-600';
    li.innerHTML = `<span class="${color}">${u.username}</span> – ${u.online ? 'online' : 'offline'}`;
    container.appendChild(li);
  });
}

async function init() {
  const user = await checkUser();
  if (!user) return;
  if (user.role === 'admin') {
    document.getElementById('admin-section').classList.remove('hidden');
  }
  await loadRound();
  await loadGeneralInfo();

  document.getElementById('join-btn').addEventListener('click', joinRound);
  document.getElementById('buzz-btn').addEventListener('click', buzz);
  document.getElementById('skip-btn').addEventListener('click', skip);
}

document.addEventListener('DOMContentLoaded', init);

async function joinRound() {
  const res = await fetch(`${BACKEND_URL}/api/buzzer/join`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.ok) {
    document.getElementById('join-btn').disabled = true;
  }
}

async function buzz() {
  const res = await fetch(`${BACKEND_URL}/api/buzzer/buzz`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.ok) {
    document.getElementById('buzz-btn').disabled = true;
  }
}

async function skip() {
  const res = await fetch(`${BACKEND_URL}/api/buzzer/skip`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (res.ok) {
    document.getElementById('skip-btn').disabled = true;
  }
}
