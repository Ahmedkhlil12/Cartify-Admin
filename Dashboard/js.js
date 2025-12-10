const salesCtx = document.createElement("canvas");
document.querySelector(".charts .card:nth-child(1) .chart-placeholder").replaceWith(salesCtx);

new Chart(salesCtx, {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [{
      label: 'Sales ($)',
      data: [1200, 1900, 3000, 2500, 4000, 4600, 5200],
      borderColor: '#059669',
      backgroundColor: 'rgba(5, 150, 105, 0.2)',
      tension: 0.4,
      fill: true
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: true }
    }
  }
});

// ===== Top Categories Pie Chart =====
const catCtx = document.createElement("canvas");
document.querySelector(".charts .card:nth-child(2) .chart-placeholder").replaceWith(catCtx);

new Chart(catCtx, {
  type: 'pie',
  data: {
    labels: ['Headphones', 'Mobiles', 'Laptops', 'Accessories'],
    datasets: [{
      label: 'Top Categories',
      data: [40, 25, 20, 15],
      backgroundColor: ['#059669', '#f59e0b', '#3b82f6', '#ef4444']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  }
});
// ===== Dynamic dashboard metrics =====
const API_BASE = 'https://localhost:7212/api';

async function safeFetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Fetch failed', url, e);
    return null;
  }
}

async function loadDashboardMetrics() {
  // Attempt to fetch users if endpoint exists; fall back to store count
  const [usersData, storesData, productsData, ordersData] = await Promise.all([
    safeFetchJson(`${API_BASE}/users`),
    safeFetchJson(`${API_BASE}/userstore`),
    safeFetchJson(`${API_BASE}/product`),
    safeFetchJson(`${API_BASE}/orders`)
  ]);

  const usersCount = Array.isArray(usersData) ? usersData.length : (Array.isArray(storesData) ? storesData.length : '—');
  const storesCount = Array.isArray(storesData) ? storesData.length : '—';
  const productsCount = Array.isArray(productsData) ? productsData.length : '—';

  // Compute sales/profit if orders data available (sum order.total or order.amount)
  let salesLabel = '—';
  if (Array.isArray(ordersData)) {
    // try to sum known fields
    const total = ordersData.reduce((acc, o) => {
      const v = o.total ?? o.amount ?? o.orderTotal ?? 0;
      return acc + (Number(v) || 0);
    }, 0);
    salesLabel = `$${total.toLocaleString()}`;
  }

  const elUsers = document.getElementById('metric-users');
  const elStores = document.getElementById('metric-stores');
  const elProducts = document.getElementById('metric-products');
  const elSales = document.getElementById('metric-sales');

  if (elUsers) elUsers.textContent = typeof usersCount === 'number' ? usersCount.toLocaleString() : usersCount;
  if (elStores) elStores.textContent = typeof storesCount === 'number' ? storesCount.toLocaleString() : storesCount;
  if (elProducts) elProducts.textContent = typeof productsCount === 'number' ? productsCount.toLocaleString() : productsCount;
  if (elSales) elSales.textContent = salesLabel;

  // Optionally refresh charts with real data if available
  // e.g. if ordersData provides monthly breakdown, update salesCtx dataset
}

// initial load
loadDashboardMetrics();

// refresh every 60 seconds
setInterval(loadDashboardMetrics, 60 * 1000);