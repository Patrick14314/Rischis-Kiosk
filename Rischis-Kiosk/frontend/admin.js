// admin.js – Admin-Übersicht für Produkte und Stats
async function loadStats() {
  const res = await fetch('/api/admin/stats', {
    credentials: 'include',
    headers: {
      'Authorization': 'Bearer ' + getCookie('sb-access-token')
    }
  });

  const stats = await res.json();
  console.log(stats);
  document.getElementById('stats').innerText = JSON.stringify(stats, null, 2);
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

window.onload = loadStats;