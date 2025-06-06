// shop.js – Produkte laden und kaufen
const productList = document.getElementById('product-list');

async function loadProducts() {
  const res = await fetch('http://localhost:3000/api/products', { credentials: 'include' });
  const products = await res.json();

  productList.innerHTML = '';
  products.forEach(p => {
    const el = document.createElement('div');
    el.innerHTML = `
      <div>
        <h3>${p.name}</h3>
        <p>${p.price} €</p>
        <button onclick="buyProduct('${p.id}')">Kaufen</button>
      </div>
    `;
    productList.appendChild(el);
  });
}

async function buyProduct(productId) {
  const res = await fetch('http://localhost:3000/api/buy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getCookie('sb-access-token')
    },
    body: JSON.stringify({ product_id: productId, quantity: 1 })
  });

  const data = await res.json();
  alert(data.message || data.error);
  loadProducts(); // Reload stock
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

window.onload = loadProducts;