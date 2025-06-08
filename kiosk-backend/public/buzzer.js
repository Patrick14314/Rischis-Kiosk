// buzzer.js – einfache Steuerung der Buzzer-Seite

const BACKEND_URL = window.location.origin;

let currentUser = null;

async function getCsrfToken() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/csrf-token`, {
      credentials: 'include',
    });
    const data = await res.json();
    return data.csrfToken;
  } catch {
    return null;
  }
}

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
  let round = null;
  if (res.status !== 404) {
    if (!res.ok) return;
    const data = await res.json();
    round = data.round;
  }

  const infoEl = document.getElementById('round-info');
  const joinBtn = document.getElementById('join-btn');
  const endBtn = document.getElementById('end-round-btn');

  if (round) {
    infoEl.textContent = `Einsatz: ${round.bet} €, Limit: ${round.points_limit}`;
    joinBtn.classList.remove('hidden');
    if (currentUser?.role === 'admin') endBtn?.classList.remove('hidden');
  } else {
    infoEl.textContent = 'Keine laufende Runde';
    joinBtn.classList.add('hidden');
    endBtn?.classList.add('hidden');
  }
}

async function loadParticipants() {
  const res = await fetch(`${BACKEND_URL}/api/buzzer/participants`, {
    credentials: 'include',
  });
  if (!res.ok) {
    document.getElementById('participant-list').innerHTML = '';
    return;
  }
  const { participants } = await res.json();
  const listEl = document.getElementById('participant-list');
  listEl.innerHTML = '';
  participants.forEach((p) => {
    const li = document.createElement('li');
    li.textContent = p.users?.name || p.username || p.user_id;
    listEl.appendChild(li);
  });
}

async function loadGeneralInfo() {
  const res = await fetch(`${BACKEND_URL}/api/buzzer/sessions`, {
    credentials: 'include',
  });
  if (!res.ok) return;
  const { sessions: online } = await res.json();
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
  currentUser = user;
  if (user.role === 'admin') {
    document.getElementById('admin-section').classList.remove('hidden');
    document
      .getElementById('round-form')
      ?.addEventListener('submit', createRound);
    document
      .getElementById('end-round-btn')
      ?.addEventListener('click', endRound);
  }
  await loadRound();
  await loadParticipants();
  await loadGeneralInfo();

  document.getElementById('join-btn').addEventListener('click', joinRound);
  document.getElementById('buzz-btn').addEventListener('click', buzz);
  document.getElementById('skip-btn').addEventListener('click', skip);

  setInterval(loadParticipants, 5000);
}

document.addEventListener('DOMContentLoaded', init);

async function joinRound() {
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/join`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
  });
  const msgEl = document.getElementById('join-message');
  if (res.ok) {
    document.getElementById('join-btn').disabled = true;
    msgEl.textContent = 'Beigetreten';
    await loadParticipants();
  } else {
    const data = await res.json().catch(() => ({}));
    msgEl.textContent = data.error || 'Fehler beim Beitreten';
  }
  setTimeout(() => {
    msgEl.textContent = '';
  }, 3000);
}

async function buzz() {
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/buzz`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
  });
  if (res.ok) {
    document.getElementById('buzz-btn').disabled = true;
  }
}

async function skip() {
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/skip`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
  });
  if (res.ok) {
    document.getElementById('skip-btn').disabled = true;
  }
}

async function createRound(e) {
  e.preventDefault();
  const bet = parseInt(document.getElementById('round-bet').value, 10);
  const limit = parseInt(document.getElementById('round-limit').value, 10);
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/round`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
    },
    body: JSON.stringify({ bet, points_limit: limit }),
  });
  const msgEl = document.getElementById('admin-message');
  if (res.ok) {
    msgEl.textContent = 'Runde gestartet';
    await loadRound();
    await loadParticipants();
  } else {
    const data = await res.json().catch(() => ({}));
    msgEl.textContent = data.error || 'Fehler beim Start';
  }
  setTimeout(() => {
    msgEl.textContent = '';
  }, 3000);
}

async function endRound(e) {
  e.preventDefault();
  const token = await getCsrfToken();
  const res = await fetch(`${BACKEND_URL}/api/buzzer/round/end`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
  });
  const msgEl = document.getElementById('admin-message');
  if (res.ok) {
    msgEl.textContent = 'Runde beendet';
    await loadRound();
    await loadParticipants();
  } else {
    const data = await res.json().catch(() => ({}));
    msgEl.textContent = data.error || 'Fehler beim Beenden';
  }
  setTimeout(() => {
    msgEl.textContent = '';
  }, 3000);
}
