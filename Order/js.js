// Global variables
const API_BASE = 'https://localhost:7212/api';
let allOrders = [];
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

// Load orders from API
async function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  const orders = await safeFetchJson(`${API_BASE}/orders`);
  if (!orders) {
    tbody.innerHTML = '<tr><td colspan="5">No orders found</td></tr>';
    return;
  }

  allOrders = Array.isArray(orders) ? orders : (orders.data ? orders.data : []);
  renderOrdersTable();
}

// Load categories for dropdown
async function loadCategories() {
  const select = document.getElementById('orderCategory');
  if (!select) return;

  const categories = await safeFetchJson(`${API_BASE}/category`);
  if (!categories) return;

  allCategories = Array.isArray(categories) ? categories : (categories.data ? categories.data : []);
  
  // Clear existing options except first one
  while (select.options.length > 1) {
    select.remove(1);
  }

  // Add categories to dropdown
  allCategories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id || cat.categoryId;
    option.textContent = cat.categoryName || cat.name || 'Unknown';
    select.appendChild(option);
  });
}

// Render orders table
function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (allOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No orders found</td></tr>';
    return;
  }

  tbody.innerHTML = allOrders.map((order, idx) => `
    <tr>
      <td>#${String(idx + 1).padStart(3, '0')}</td>
      <td>${order.orderName || order.name || 'N/A'}</td>
      <td>${order.categoryName || order.category || 'N/A'}</td>
      <td>${(order.description || 'N/A').substring(0, 50)}...</td>
      <td>
        <button class="btn btn-view" onclick="viewOrder(${order.id || order.orderId})"><i class="fas fa-eye"></i></button>
        <button class="btn btn-delete" onclick="deleteOrder(${order.id || order.orderId})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

// View order details
function viewOrder(orderId) {
  const order = allOrders.find(o => (o.id || o.orderId) === orderId);
  if (!order) return;
  alert(`Order: ${order.orderName || order.name}\nCategory: ${order.categoryName || order.category}\nDescription: ${order.description || 'N/A'}`);
}

// Delete order
async function deleteOrder(orderId) {
  if (!confirm('Delete this order?')) return;
  const result = await safeFetchJson(`${API_BASE}/orders/${orderId}`, {
    method: 'DELETE'
  });
  if (result || (result === null)) {
    alert('Order deleted!');
    loadOrders();
  } else {
    alert('Error deleting order.');
  }
}

// Open Add Order modal
function openAddOrderModal() {
  console.log('===== openAddOrderModal called =====');
  const modal = document.getElementById('addOrderModal');
  console.log('Modal element found:', !!modal);
  console.log('Modal element:', modal);
  if (modal) {
    console.log('Modal class before:', modal.className);
    modal.classList.add('open');
    console.log('Modal class after:', modal.className);
  } else {
    console.error('Modal element NOT found!');
  }
}

// Close Add Order modal
function closeAddOrderModal() {
  const modal = document.getElementById('addOrderModal');
  if (modal) modal.classList.remove('open');
  document.getElementById('addOrderForm')?.reset();
}

// Submit form to add order
async function submitAddOrder(e) {
  e.preventDefault();
  
  const nameInput = document.getElementById('orderName');
  const categoryInput = document.getElementById('orderCategory');
  const descriptionInput = document.getElementById('orderDescription');
  const imageInput = document.getElementById('orderImage');

  // Convert image to base64
  let imageData = '';
  if (imageInput.files && imageInput.files[0]) {
    const file = imageInput.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      imageData = event.target.result;
      
      const orderData = {
        orderName: nameInput.value,
        categoryId: parseInt(categoryInput.value),
        description: descriptionInput.value,
        imageUrl: imageData,
        createdDate: new Date().toISOString(),
        isDeleted: false
      };

      const result = await safeFetchJson(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (result) {
        alert('Order created successfully!');
        closeAddOrderModal();
        loadOrders();
      } else {
        alert('Error creating order. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  } else {
    alert('Please select an image file.');
  }
}

// Initialize interactions once per page
document.addEventListener('DOMContentLoaded', () => {
  // Load orders and categories from API on page load
  loadOrders();
  loadCategories();

  // Add Order form submission
  const form = document.getElementById('addOrderForm');
  if (form) {
    form.addEventListener('submit', submitAddOrder);
  }

  // Close modal when clicking outside
  const addOrderModal = document.getElementById('addOrderModal');
  if (addOrderModal) {
    addOrderModal.addEventListener('click', (e) => {
      if (e.target === addOrderModal) closeAddOrderModal();
    });
  }
});

// Expose functions globally for inline handlers in HTML
window.openAddOrderModal = openAddOrderModal;
window.closeAddOrderModal = closeAddOrderModal;
window.viewOrder = viewOrder;
window.deleteOrder = deleteOrder;