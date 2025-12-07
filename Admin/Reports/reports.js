// Global variables
const API_BASE = 'https://localhost:7212/api';
let allOrders = [];
let allUsers = [];
let allProducts = [];
let allCategories = [];

// Safe fetch wrapper
async function safeFetchJson(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.warn(`HTTP ${response.status}:`, response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`Fetch error at ${url}:`, error.message);
    return null;
  }
}

// Load all data from API
async function loadReportData() {
  const ordersData = await safeFetchJson(`${API_BASE}/orders`);
  const usersData = await safeFetchJson(`${API_BASE}/users`);
  const productsData = await safeFetchJson(`${API_BASE}/product`);
  const categoriesData = await safeFetchJson(`${API_BASE}/category`);

  allOrders = Array.isArray(ordersData) ? ordersData : (ordersData?.data ? ordersData.data : []);
  allUsers = Array.isArray(usersData) ? usersData : (usersData?.data ? usersData.data : []);
  allProducts = Array.isArray(productsData) ? productsData : (productsData?.data ? productsData.data : []);
  allCategories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data ? categoriesData.data : []);

  updateKPIs();
  updateCharts();
}

// Calculate and update KPI values
function updateKPIs() {
  // Total Orders
  const totalOrders = allOrders.length;
  document.getElementById('kpiOrders').textContent = totalOrders.toLocaleString();

  // Total Customers (Users)
  const totalCustomers = allUsers.length;
  document.getElementById('kpiCustomers').textContent = totalCustomers.toLocaleString();

  // Total Revenue (sum of order prices if available, otherwise estimate)
  const totalRevenue = allOrders.reduce((sum, order) => {
    return sum + (order.price || 0);
  }, 0);
  document.getElementById('kpiRevenue').textContent = `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // Conversion Rate (customers who placed orders / total customers)
  const conversionRate = totalCustomers > 0 ? ((totalOrders / totalCustomers) * 100).toFixed(2) : 0;
  document.getElementById('kpiConversion').textContent = `${conversionRate}%`;
}

// Chart instances
let revenueChart, statusChart, categoriesChart, geoChart;

// Update all charts
function updateCharts() {
  updateRevenueChart();
  updateStatusChart();
  updateCategoriesChart();
  updateGeoChart();
}

// Revenue Trend Chart
function updateRevenueChart() {
  const ctx = document.getElementById('revenueChart')?.getContext('2d');
  if (!ctx) return;

  // Generate last 7 days data
  const days = 7;
  const labels = [];
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    // Random revenue between 3000-6000
    data.push(Math.floor(Math.random() * 3000 + 3000));
  }

  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Revenue ($)',
        data: data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Orders by Status Chart
function updateStatusChart() {
  const ctx = document.getElementById('statusChart')?.getContext('2d');
  if (!ctx) return;

  // Simulate order status distribution
  const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  const statusData = [
    Math.floor(allOrders.length * 0.15),
    Math.floor(allOrders.length * 0.25),
    Math.floor(allOrders.length * 0.30),
    Math.floor(allOrders.length * 0.30)
  ];

  if (statusChart) statusChart.destroy();
  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: statuses,
      datasets: [{
        data: statusData,
        backgroundColor: ['#fbbf24', '#f97316', '#06b6d4', '#10b981'],
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Top Categories Chart
function updateCategoriesChart() {
  const ctx = document.getElementById('categoriesChart')?.getContext('2d');
  if (!ctx) return;

  // Count products per category
  const categoryLabels = allCategories.map(c => c.categoryName || c.name || 'Unknown').slice(0, 5);
  const categoryData = allCategories.map((cat, idx) => {
    const count = allProducts.filter(p => p.categoryId === (cat.id || cat.categoryId)).length;
    return count;
  }).slice(0, 5);

  if (categoriesChart) categoriesChart.destroy();
  categoriesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categoryLabels,
      datasets: [{
        label: 'Products',
        data: categoryData,
        backgroundColor: '#8b5cf6',
        borderColor: '#7c3aed',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Geography Chart (simulated)
function updateGeoChart() {
  const ctx = document.getElementById('geoChart')?.getContext('2d');
  if (!ctx) return;

  const regions = ['North', 'South', 'East', 'West'];
  const regionData = [245, 189, 342, 198];

  if (geoChart) geoChart.destroy();
  geoChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: regions,
      datasets: [{
        label: 'Sales',
        data: regionData,
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        pointBackgroundColor: '#ec4899',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// Export functionality
function exportReport() {
  const summary = `
CARTIFY REPORTS & ANALYTICS
===========================
Generated: ${new Date().toLocaleString()}

KEY METRICS:
- Total Orders: ${allOrders.length}
- Total Customers: ${allUsers.length}
- Total Products: ${allProducts.length}
- Total Categories: ${allCategories.length}

ORDERS DATA:
${allOrders.map((o, idx) => `${idx + 1}. ${o.orderName || 'Order'} - ${o.description || 'N/A'}`).join('\n')}

CUSTOMERS DATA:
${allUsers.map((u, idx) => `${idx + 1}. ${u.name || 'User'} (${u.email || 'N/A'})`).join('\n')}
  `;

  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(summary));
  element.setAttribute('download', `Cartify_Reports_${new Date().getTime()}.txt`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Load report data from API
  loadReportData();

  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportReport);
  }

  // Range filter
  const rangeSelect = document.getElementById('rangeSelect');
  if (rangeSelect) {
    rangeSelect.addEventListener('change', (e) => {
      console.log('Report range changed to:', e.target.value);
      // In a real app, this would filter the data by date range
      updateCharts();
    });
  }
});

// Expose functions globally
window.exportReport = exportReport;
