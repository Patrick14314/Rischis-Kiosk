// admin.js – Adminlogik über gesicherte Backend-API

// Basis-URL des Backends
const BACKEND_URL = "https://rischis-kiosk-t2uv.onrender.com";

function showMessage(msg, isError = false) {
  const el = document.getElementById('product-result');
  el.textContent = msg;
  el.className = isError ? 'text-red-500 text-center mt-2' : 'text-green-600 text-center mt-2';
  setTimeout(() => el.textContent = '', 4000);
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}
if (localStorage.getItem('darkMode') !== 'false') {
  document.documentElement.classList.add('dark');
}

function toggleSection(id) {
  document.getElementById(`${id}-container`)?.classList.toggle('hidden');
}

// Statistiken laden
async function loadStats() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/stats`, {
      credentials: 'include'
    });
    const stats = await res.json();
    if (!res.ok) throw new Error(stats.error);

    document.getElementById('total-products').textContent = stats.total_products;
    document.getElementById('total-stock').textContent = stats.total_stock;
    document.getElementById('total-value').textContent = stats.total_value.toFixed(2) + ' €';
    document.getElementById('total-profit').textContent = stats.total_profit.toFixed(2) + ' €';
    document.getElementById('total-revenue').textContent = stats.total_revenue.toFixed(2) + ' €';
  } catch (err) {
    console.error(err);
    showMessage("Fehler beim Laden der Statistik", true);
  }
}

// Kaufverlauf laden
async function loadPurchases() {
  try {
    const month = document.getElementById('purchase-month')?.value;
    const year = document.getElementById('purchase-year')?.value;
    const query = month && year ? `?month=${month}&year=${year}` : '';

    const res = await fetch(`${BACKEND_URL}/api/admin/purchases${query}`, {
      credentials: 'include'
    });
    const purchases = await res.json();
    if (!res.ok) throw new Error(purchases.error);

    const table = document.getElementById('purchase-table');
    table.innerHTML = '';

    purchases.forEach(p => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-gray-200 dark:border-gray-700';
      tr.innerHTML = `
        <td class="p-2">${new Date(p.created_at).toLocaleString()}</td>
        <td class="p-2">${p.user?.email || '-'}</td>
        <td class="p-2">${p.product?.name || '-'}</td>
        <td class="p-2">${p.price.toFixed(2)} €</td>
        <td class="p-2">${p.purchase_price.toFixed(2)} €</td>
      `;
      table.appendChild(tr);
    });
  } catch (err) {
    showMessage("Fehler beim Laden der Käufe", true);
  }
}

// CSV exportieren
async function exportCSV() {
  const month = document.getElementById('purchase-month')?.value;
  const year = document.getElementById('purchase-year')?.value;
  const query = month && year ? `?month=${month}&year=${year}` : '';
  const res = await fetch(`${BACKEND_URL}/api/admin/purchases${query}`, {
    credentials: 'include'
  });
  const purchases = await res.json();
  if (!res.ok) return alert('Fehler beim CSV Export');

  const csv = ['Datum;Nutzer;Produkt;VK;EK'];
  purchases.forEach(p => {
    csv.push(`${new Date(p.created_at).toLocaleString()};${p.user?.email || '-'};${p.product?.name || '-'};${p.price.toFixed(2)};${p.purchase_price.toFixed(2)}`);
  });

  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'käufe.csv';
  link.click();
}

// Produkte laden
async function loadProducts() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/products`, { credentials: 'include' });
    const products = await res.json();

    const filter = document.getElementById('category-filter')?.value || 'all';
    const list = document.getElementById('product-list');
    list.innerHTML = '';

    products.filter(p => filter === 'all' || p.category === filter).forEach(p => {
      const li = document.createElement('li');
      li.className = 'border p-4 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow';
      li.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p class="font-semibold">${p.name}</p>
            <p class="text-sm text-gray-600 dark:text-gray-300">${p.price.toFixed(2)} € – Bestand: ${p.stock}</p>
          </div>
          <div class="flex gap-2">
            <button onclick="toggleAvailability('${p.id}', ${p.available})" class="bg-yellow-500 text-white px-2 py-1 rounded">${p.available ? 'Verstecken' : 'Anzeigen'}</button>
            <button onclick="editProduct('${p.id}', '${p.name}', ${p.price}, ${p.purchase_price}, ${p.stock}, '${p.category}')" class="bg-blue-600 text-white px-2 py-1 rounded">Bearbeiten</button>
            <button onclick="deleteProduct('${p.id}')" class="bg-red-600 text-white px-2 py-1 rounded">Löschen</button>
          </div>
        </div>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    showMessage("Fehler beim Laden der Produkte", true);
  }
}

// Neues Produkt hinzufügen
async function addProduct(e) {
  e.preventDefault();
  const name = document.getElementById('product-name').value.trim();
  const price = parseFloat(document.getElementById('product-price').value);
  const purchase = parseFloat(document.getElementById('product-purchase').value);
  const stock = parseInt(document.getElementById('product-stock').value);
  const category = document.getElementById('product-category').value;

  if (!name || isNaN(price) || isNaN(purchase) || isNaN(stock) || !category) {
    return showMessage("Bitte alle Felder korrekt ausfüllen", true);
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, price, purchase_price: purchase, stock, category })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    showMessage("Produkt gespeichert");
    e.target.reset();
    loadProducts();
  } catch (err) {
    showMessage("Fehler beim Speichern", true);
  }
}

// Produkt bearbeiten
function editProduct(id, name, price, purchase, stock, category) {
  document.getElementById('product-name').value = name;
  document.getElementById('product-price').value = price;
  document.getElementById('product-purchase').value = purchase;
  document.getElementById('product-stock').value = stock;
  document.getElementById('product-category').value = category;

  document.getElementById('add-product').onsubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = {
        name: document.getElementById('product-name').value.trim(),
        price: parseFloat(document.getElementById('product-price').value),
        purchase_price: parseFloat(document.getElementById('product-purchase').value),
        stock: parseInt(document.getElementById('product-stock').value),
        category: document.getElementById('product-category').value
      };

      const res = await fetch(`${BACKEND_URL}/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updated)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      showMessage("Produkt aktualisiert");
      e.target.reset();
      loadProducts();
    } catch (err) {
      showMessage("Fehler beim Aktualisieren", true);
    }
  };
}

// Verfügbarkeit umschalten
async function toggleAvailability(id, available) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/products/${id}/available`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ available: !available })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    loadProducts();
  } catch (err) {
    showMessage("Fehler beim Umschalten der Verfügbarkeit", true);
  }
}

// Produkt löschen
async function deleteProduct(id) {
  if (!confirm("Wirklich löschen? Auch die dazugehörigen Käufe!")) return;
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/products/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    showMessage("Produkt gelöscht");
    loadProducts();
  } catch (err) {
    showMessage("Fehler beim Löschen", true);
  }
}


// Erweiterte Statistik & Käufe laden
async function loadAdvancedStatsAndPurchases() {
  const { data: purchases } = await supabase.from('purchases').select('created_at, user_name, product_name, price, purchase_price');

  // Statistik berechnen
  const products = await supabase.from('products').select('stock, price, purchase_price');
  const stats = {
    totalProducts: products.data.length,
    totalStock: products.data.reduce((sum, p) => sum + (p.stock || 0), 0),
    totalValue: products.data.reduce((sum, p) => sum + ((p.stock || 0) * (p.purchase_price || 0)), 0),
    totalRevenue: purchases.reduce((sum, p) => sum + (p.price || 0), 0),
    totalProfit: purchases.reduce((sum, p) => sum + ((p.price || 0) - (p.purchase_price || 0)), 0)
  };

  document.getElementById('total-products').textContent = stats.totalProducts;
  document.getElementById('total-stock').textContent = stats.totalStock;
  document.getElementById('total-value').textContent = stats.totalValue.toFixed(2) + " €";
  document.getElementById('total-revenue').textContent = stats.totalRevenue.toFixed(2) + " €";
  document.getElementById('total-profit').textContent = stats.totalProfit.toFixed(2) + " €";

  // Kaufverlauf-Tabelle befüllen
  const tbody = document.getElementById('purchase-table');
  tbody.innerHTML = "";
  purchases.forEach(p => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="p-2">${formatDateTime(p.created_at)}</td>
      <td class="p-2">${p.user_name}</td>
      <td class="p-2">${p.product_name}</td>
      <td class="p-2">${p.price.toFixed(2)} €</td>
      <td class="p-2">${p.purchase_price?.toFixed(2) ?? '-'}</td>
    `;
    tbody.appendChild(row);
  });
}

// CSV Export
document.getElementById('purchase-export')?.addEventListener('click', async () => {
  const month = parseInt(document.getElementById('purchase-month').value);
  const year = parseInt(document.getElementById('purchase-year').value);
  const { data } = await supabase.from('purchases').select('created_at, user_name, product_name, price, purchase_price');

  const filtered = data.filter(p => {
    const date = new Date(p.created_at);
    return (!month || date.getMonth() + 1 === month) && (!year || date.getFullYear() === year);
  });

  const csv = [
    ["Datum", "Nutzer", "Produkt", "VK", "EK"],
    ...filtered.map(p => [
      formatDateTime(p.created_at),
      p.user_name,
      p.product_name,
      p.price.toFixed(2).replace('.', ','),
      p.purchase_price?.toFixed(2).replace('.', ',') ?? '-'
    ])
  ].map(r => r.join(";")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Käufe_${month || 'alle'}-${year || 'alle'}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

window.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadStats();
  loadAdvancedStatsAndPurchases();
  document.getElementById('add-product')?.addEventListener('submit', addProduct);
  document.getElementById('category-filter')?.addEventListener('change', loadProducts);
});
