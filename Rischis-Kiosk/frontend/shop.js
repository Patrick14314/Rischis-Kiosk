// shop.js – ersetzt Supabase-Zugriffe durch sichere API-Aufrufe an dein Backend

const BACKEND_URL = "https://rischis-kiosk.onrender.com";

let currentUser = null;
let userBalance = 0;

function showMessage(text, type = 'info') {
  const el = document.getElementById('message');
  el.textContent = text;
  el.className = type === 'error' ? 'text-red-600' : 'text-green-600';
  setTimeout(() => { el.textContent = ''; }, 4000);
}

async function loadUser() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/user`, { credentials: 'include' });
    const user = await res.json();
    if (!user?.id) throw new Error("Keine Nutzerdaten erhalten");

    currentUser = user;
    userBalance = user.balance || 0;

    document.getElementById('user-email').textContent = user.email;
    const balanceElement = document.getElementById('user-balance');
    balanceElement.textContent = `${userBalance.toFixed(2)} €`;
    balanceElement.className = userBalance < 0
      ? 'text-red-600 dark:text-red-400 font-bold'
      : 'text-green-600 dark:text-green-400 font-bold';
  } catch (err) {
    console.error(err);
    showMessage("Fehler beim Laden des Nutzers", 'error');
  }
}

async function loadProducts() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/products`);
    const products = await res.json();
    const list = document.getElementById('product-list');
    list.innerHTML = '';

    products.forEach(product => {
      const li = document.createElement('li');
      li.className = 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 rounded-lg shadow-md hover:shadow-lg transition text-gray-800 dark:text-white';

      li.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p class="text-base font-medium">${product.name}</p>
            <p class="text-sm text-gray-600 dark:text-gray-300">${product.price.toFixed(2)} € – Bestand: ${product.stock}</p>
          </div>
          ${product.stock > 0 ?
            `<div class="flex items-center gap-2">
              <input type="number" min="1" max="${product.stock}" value="1" id="qty-${product.id}" class="w-12 text-center bg-transparent focus:outline-none border rounded dark:text-white">
              <button class="bg-green-600 text-white text-sm px-3 py-1 rounded-md shadow hover:bg-green-700" onclick="buyProduct('${product.id}', 'qty-${product.id}', '${product.name}', ${product.price})">Kaufen</button>
            </div>` : '<span class="text-red-500">Ausverkauft</span>'
          }
        </div>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    showMessage("Fehler beim Laden der Produkte", 'error');
  }
}

async function buyProduct(productId, qtyInputId, productName, unitPrice) {
  const qty = parseInt(document.getElementById(qtyInputId)?.value || "1");
  if (!Number.isInteger(qty) || qty <= 0) return showMessage("Ungültige Menge", "error");

  const confirmText = `Möchtest du wirklich ${qty}x ${productName} für ${(unitPrice * qty).toFixed(2)} € kaufen?`;
  if (!confirm(confirmText)) return;

  try {
    const res = await fetch(`${BACKEND_URL}/api/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ product_id: productId, quantity: qty })
    });
    const result = await res.json();

    if (!res.ok) throw new Error(result.error || 'Unbekannter Fehler');

    showMessage("Kauf erfolgreich!", 'success');
    await loadUser();
    await loadProducts();
  } catch (err) {
    console.error(err);
    showMessage("Fehler beim Kauf", 'error');
  }
}

// Start beim Laden
window.addEventListener('DOMContentLoaded', () => {
  loadUser();
  loadProducts();
});
