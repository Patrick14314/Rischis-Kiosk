const BACKEND_URL = window.location.origin;

let csrfToken;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch(`${BACKEND_URL}/api/csrf-token`, {
      credentials: 'include',
    });
    const data = await res.json();
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch (err) {
    console.error('CSRF-Token konnte nicht geladen werden', err);
    return null;
  }
}

let userBalance = 0;

let selectedColor = null;

const balanceEl = document.getElementById('balance');
const resultCard = document.getElementById('result-card');

function launchConfetti() {
  if (typeof confetti === 'function') {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
  }
}

async function loadUser() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/user`, {
      credentials: 'include',
    });
    const user = await res.json();
    userBalance = user.balance || 0;
    document.getElementById('balance').textContent =
      `${userBalance.toFixed(2)} €`;
  } catch (err) {
    console.error('Fehler beim Laden des Nutzers', err);
    window.location.href = 'index.html';
  }
}

async function playPoker() {
  const betInput = document.getElementById('bet');
  const bet = parseFloat(betInput.value.replace(',', '.'));
  if (!selectedColor) {
    const resultEl = document.getElementById('result');
    resultEl.textContent = 'Bitte zuerst eine Farbe wählen';
    resultCard.classList.remove('result-win', 'result-lose', 'hidden');
    resultCard.classList.add('result-show', 'result-lose');
    setTimeout(() => {
      resultCard.classList.add('hidden');
      resultCard.classList.remove('result-show', 'result-lose');
      resultEl.textContent = '';
    }, 1500);
    return;
  }
  if (!bet || bet <= 0) {
    const resultEl = document.getElementById('result');
    resultEl.textContent = 'Ungültiger Einsatz';
    resultCard.classList.remove('result-win', 'result-lose', 'hidden');
    resultCard.classList.add('result-show', 'result-lose');
    setTimeout(() => {
      resultCard.classList.add('hidden');
      resultCard.classList.remove('result-show', 'result-lose');
      resultEl.textContent = '';
    }, 1500);
    return;
  }
  const playBtn = document.getElementById('play');
  playBtn.disabled = true;
  try {
    const token = await getCsrfToken();
    const res = await fetch(`${BACKEND_URL}/api/poker/play`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ bet, color: selectedColor }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Fehler');
    userBalance = data.newBalance;
    balanceEl.textContent = `${userBalance.toFixed(2)} €`;
    balanceEl.classList.add('balance-update');
    const resultEl = document.getElementById('result');
    const message = data.win ? 'Gewonnen!' : 'Verloren!';
    resultEl.textContent = `${message} (${data.card.symbol})`;
    resultCard.classList.remove('hidden', 'result-win', 'result-lose');
    resultCard.classList.add(
      'result-show',
      data.win ? 'result-win' : 'result-lose',
    );
    if (data.win) {
      resultEl.classList.add('win-animation');
      launchConfetti();
    } else {
      resultEl.classList.add('lose-animation');
    }
    setTimeout(() => {
      resultCard.classList.add('hidden');
      resultCard.classList.remove('result-show', 'result-win', 'result-lose');
      resultEl.textContent = '';
      resultEl.classList.remove('win-animation', 'lose-animation');
      balanceEl.classList.remove('balance-update');
      playBtn.disabled = false;
    }, 2000);
  } catch (err) {
    console.error(err);
    const resultEl = document.getElementById('result');
    resultEl.textContent = err.message || 'Fehler beim Spiel';
    resultCard.classList.remove('result-win', 'result-lose', 'hidden');
    resultCard.classList.add('result-show', 'result-lose');
    setTimeout(() => {
      resultCard.classList.add('hidden');
      resultCard.classList.remove('result-show', 'result-win', 'result-lose');
      resultEl.textContent = '';
      playBtn.disabled = false;
    }, 2000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadUser();
  const playBtn = document.getElementById('play');
  playBtn.addEventListener('click', playPoker);
  getCsrfToken();
  document.getElementById('bet').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') playPoker();
  });
  const betInput = document.getElementById('bet');
  document.querySelectorAll('.quick-bet').forEach((btn) => {
    btn.addEventListener('click', () => {
      betInput.value = parseFloat(btn.dataset.bet).toFixed(2);
      document
        .querySelectorAll('.quick-bet')
        .forEach((b) => b.classList.remove('ring-2', 'ring-offset-2'));
      btn.classList.add('ring-2', 'ring-offset-2');
    });
  });
  document.querySelectorAll('.color-choice').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedColor = btn.dataset.color;
      document
        .querySelectorAll('.color-choice')
        .forEach((b) => b.classList.remove('ring-2', 'ring-offset-2'));
      btn.classList.add('ring-2', 'ring-offset-2');
    });
  });
  betInput.addEventListener('input', () => {
    document
      .querySelectorAll('.quick-bet')
      .forEach((b) => b.classList.remove('ring-2', 'ring-offset-2'));
  });
});
