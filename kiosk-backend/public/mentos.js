// mentos.js – Tracker-Logik über Backend-Routen

// Backend und Frontend laufen auf derselben Domain
// Einheitliche Definition für alle Frontend-Skripte
const BACKEND_URL = window.location.origin;

async function loadUserAndSessions() {
  try {
    const userRes = await fetch(`${BACKEND_URL}/api/user`, { credentials: 'include' });
    const user = await userRes.json();
    if (!user?.id) throw new Error("Nicht eingeloggt");

    document.getElementById("user-name").textContent = user.name || user.email;
    document.getElementById("user-balance").textContent = `${user.balance?.toFixed(2) || 0} €`;

    const trackerRes = await fetch(`${BACKEND_URL}/api/mentos`, { credentials: 'include' });
    const tracker = await trackerRes.json();
    renderTracker(tracker);
  } catch (err) {
    console.error(err);
    alert("Fehler beim Laden der Daten");
  }
}

function renderTracker(data) {
  const container = document.getElementById("tracker-list");
  container.innerHTML = "";
  data.forEach(row => {
    const li = document.createElement("li");
    li.className = "p-2 border rounded flex justify-between items-center bg-white dark:bg-gray-800 text-gray-800 dark:text-white mb-1";
    li.innerHTML = `
      <span>${row.created_at?.split("T")[0] || "?"} – ${row.user_name}</span>
      <button onclick="deleteEntry('${row.id}')" class="text-red-500 hover:text-red-700">✕</button>
    `;
    container.appendChild(li);
  });
}

async function addEntry() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/mentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Fehler beim Hinzufügen');
    loadUserAndSessions();
  } catch (err) {
    alert("Fehler beim Eintragen");
    console.error(err);
  }
}

async function deleteEntry(id) {
  if (!confirm("Eintrag wirklich löschen?")) return;
  try {
    const res = await fetch(`${BACKEND_URL}/api/mentos/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) throw new Error();
    loadUserAndSessions();
  } catch (err) {
    alert("Fehler beim Löschen");
  }
}

document.addEventListener("DOMContentLoaded", loadUserAndSessions);
window.addEntry = addEntry;
window.deleteEntry = deleteEntry;
