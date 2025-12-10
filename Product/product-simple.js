// API Configuration
const API_BASE_URL = 'https://localhost:7212/api';
const PRODUCT_ENDPOINT = `${API_BASE_URL}/product`;

// DOM Elements
const modal = document.getElementById('productModal');
const form = document.getElementById('productForm');
const tableBody = document.getElementById('productTableBody');
const toast = document.getElementById('toast');
const addBtn = document.getElementById('addProductBtn');
const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const modalTitle = document.getElementById('modalTitle');

let editingId = null;

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Open modal for adding new product
function openModal(product = null) {
    form.reset();
    editingId = null;
    
    if (product) {
        modalTitle.textContent = `Edit Product #${product.productId}`;
        document.getElementById('productName').value = product.productName || '';
        document.getElementById('productDescription').value = product.productDescription || '';
        document.getElementById('typeId').value = product.typeId || '';
        document.getElementById('userStoreId').value = product.userStoreId || '';
        document.getElementById('createdBy').value = product.createdBy || '';
        editingId = product.productId;
    } else {
        modalTitle.textContent = 'Add Product';
    }
    
    modal.classList.add('open');
}

// Close modal
function closeModal() {
    modal.classList.remove('open');
    form.reset();
    editingId = null;
}

// Fetch and display all products
async function loadProducts() {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';
    try {
        const response = await fetch(PRODUCT_ENDPOINT);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const products = await response.json();
        if (!Array.isArray(products)) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No products found</td></tr>';
            return;
        }
        
        tableBody.innerHTML = products.map(prod => `
            <tr>
                <td>#${prod.productId}</td>
                <td>${prod.productName || '—'}</td>
                <td>${prod.typeId || '—'}</td>
                <td>${prod.userStoreId || '—'}</td>
                <td>${prod.isDeleted ? '❌ Deleted' : '✅ Active'}</td>
                <td class="actions-cell">
                    <button class="btn-edit" onclick="editProduct(${prod.productId})">Edit</button>
                    <button class="btn-delete" onclick="deleteProduct(${prod.productId})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #e74c3c;">Error: ${error.message}</td></tr>`;
        showToast(`Failed to load products: ${error.message}`, 'error');
    }
}

// Edit product
async function editProduct(id) {
    try {
        const response = await fetch(`${PRODUCT_ENDPOINT}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        const product = await response.json();
        openModal(product);
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Delete product
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch(`${PRODUCT_ENDPOINT}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        showToast('Product deleted successfully', 'success');
        loadProducts();
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Submit form (Create or Update)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        productName: document.getElementById('productName').value.trim(),
        productDescription: document.getElementById('productDescription').value.trim(),
        typeId: parseInt(document.getElementById('typeId').value) || null,
        userStoreId: parseInt(document.getElementById('userStoreId').value) || null,
        createdBy: parseInt(document.getElementById('createdBy').value) || null,
        isDeleted: false,
        createdDate: new Date().toISOString()
    };
    
    if (!data.productName) {
        showToast('Product Name is required', 'error');
        return;
    }
    
    if (!data.productDescription) {
        showToast('Description is required', 'error');
        return;
    }
    
    if (!data.userStoreId) {
        showToast('Store ID is required', 'error');
        return;
    }
    
    try {
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `${PRODUCT_ENDPOINT}/${editingId}` : PRODUCT_ENDPOINT;
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        showToast(`Product ${editingId ? 'updated' : 'created'} successfully`, 'success');
        closeModal();
        loadProducts();
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
});

// Event listeners
addBtn.addEventListener('click', () => openModal());
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Load products on page load
document.addEventListener('DOMContentLoaded', loadProducts);
