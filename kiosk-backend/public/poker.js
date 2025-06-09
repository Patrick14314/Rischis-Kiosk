const BACKEND_URL = window.location.origin;

async function getCsrfToken() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/csrf-token`, {
      credentials: 'include',
    });
    const data = await res.json();
    return data.csrfToken;
  } catch (err) {
    console.error('CSRF-Token konnte nicht geladen werden', err);
    return null;
  }
}

let userBalance = 0;

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
  if (!bet || bet <= 0) {
    document.getElementById('result').textContent = 'Ungültiger Einsatz';
    return;
  }
  try {
    const token = await getCsrfToken();
    const res = await fetch(`${BACKEND_URL}/api/poker/play`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ bet }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Fehler');
    userBalance = data.newBalance;
    document.getElementById('balance').textContent =
      `${userBalance.toFixed(2)} €`;
    const resultEl = document.getElementById('result');
    resultEl.textContent = data.win ? 'Gewonnen!' : 'Verloren!';
    if (data.win) {
      resultEl.classList.add('win-animation');
    }
    setTimeout(() => {
      resultEl.textContent = '';
      resultEl.classList.remove('win-animation');
    }, 2000);
  } catch (err) {
    console.error(err);
    document.getElementById('result').textContent = 'Fehler beim Spiel';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadUser();
  document.getElementById('play').addEventListener('click', playPoker);
});
