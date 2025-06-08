// buzzer.js – einfache Steuerung der Buzzer-Seite

const SUPABASE_URL = 'SUPABASE_URL'; // TODO: anpassen
const SUPABASE_ANON_KEY = 'SUPABASE_ANON_KEY'; // TODO: anpassen

const BACKEND_URL = window.location.origin;
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let activeRound = null;

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
  const { data: round } = await supabase
    .from('buzzer_rounds')
    .select('*')
    .eq('active', true)
    .single();

  activeRound = round;

  const infoEl = document.getElementById('round-info');
  const joinBtn = document.getElementById('join-btn');

  if (round) {
    infoEl.textContent = `Einsatz: ${round.bet} € – Limit: ${round.points_limit} Punkte`;
    joinBtn.classList.remove('hidden');
  } else {
    infoEl.textContent = 'Keine laufende Runde';
    joinBtn.classList.add('hidden');
  }
}

async function joinRound() {
  if (!activeRound || !currentUser) return;

  await supabase.from('buzzer_participants').insert({
    round_id: activeRound.id,
    user_id: currentUser.id,
    username: currentUser.email,
  });

  await loadRound();
}

async function loadGeneralInfo() {
  const { data: online } = await supabase
    .from('user_sessions')
    .select('username, online, users(role)');
  const container = document.getElementById('general-info');
  container.innerHTML = '';
  online?.forEach((u) => {
    const li = document.createElement('div');
    const color = u.users?.role === 'admin' ? 'text-red-600' : 'text-green-600';
    li.innerHTML = `<span class="${color}">${u.username}</span> – ${u.online ? 'online' : 'offline'}`;
    container.appendChild(li);
  });
}

async function startRound() {
  const betStr = prompt('Einsatz wählen (0.25–2.00 €)', '0.25');
  if (!betStr) return;
  const bet = parseFloat(betStr);
  if (Number.isNaN(bet)) return;
  const limitStr = prompt('Punktelimit festlegen', '5');
  if (!limitStr) return;
  const pointsLimit = parseInt(limitStr, 10);
  if (Number.isNaN(pointsLimit)) return;

  await supabase.from('buzzer_rounds').insert({
    bet,
    points_limit: pointsLimit,
    active: true,
    start_time: new Date().toISOString(),
  });

  await loadRound();
}

function renderAdminControls() {
  const container = document.getElementById('admin-controls');
  container.innerHTML = '';
  const btn = document.createElement('button');
  btn.id = 'start-round-btn';
  btn.textContent = 'Neue Runde starten';
  btn.className = 'px-3 py-1 bg-green-600 text-white rounded';
  btn.addEventListener('click', startRound);
  container.appendChild(btn);
}

async function init() {
  currentUser = await checkUser();
  if (!currentUser) return;

  document.getElementById('join-btn').addEventListener('click', joinRound);

  if (currentUser.role === 'admin') {
    document.getElementById('admin-section').classList.remove('hidden');
    renderAdminControls();
  }

  await loadRound();
  await loadGeneralInfo();
}

document.addEventListener('DOMContentLoaded', init);
