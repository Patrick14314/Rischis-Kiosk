function setupActivityTracking() {
  fetch('/api/activity', {
    method: 'POST',
    credentials: 'include'
  }).then(res => {
    if (!res.ok) throw new Error("Fehler beim Tracking");
    return res.json();
  }).then(() => {
    console.log("🟢 Aktivität gesendet");
  }).catch(err => {
    console.error("🔴 Tracking-Fehler:", err);
  });
}
