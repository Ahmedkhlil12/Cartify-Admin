// API Configuration
const API_BASE_URL = 'https://localhost:7212/api';
const STORE_ENDPOINT = `${API_BASE_URL}/userstore`;

// DOM Elements
const modal = document.getElementById('storeModal');
const form = document.getElementById('storeForm');
const tableBody = document.getElementById('storeTableBody');
const toast = document.getElementById('toast');
const addBtn = document.getElementById('addStoreBtn');
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

// Open modal for adding new store
function openModal(store = null) {
    form.reset();
    editingId = null;
    
    if (store) {
        modalTitle.textContent = `Edit Store #${store.userStoreId}`;
        document.getElementById('merchantId').value = store.merchantId || '';
        document.getElementById('storeName').value = store.storeName || '';
        document.getElementById('inventoryId').value = store.inventoryId || '';
        document.getElementById('categoryId').value = store.categoryId || '';
        document.getElementById('createdBy').value = store.createdBy || '';
        editingId = store.userStoreId;
    } else {
        modalTitle.textContent = 'Add Store';
    }
    
    modal.classList.add('open');
}

// Close modal
function closeModal() {
    modal.classList.remove('open');
    form.reset();
    editingId = null;
}

// Fetch and display all stores
async function loadStores() {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';
    try {
        const response = await fetch(STORE_ENDPOINT);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const stores = await response.json();
        if (!Array.isArray(stores)) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No stores found</td></tr>';
            return;
        }
        
        tableBody.innerHTML = stores.map(store => `
            <tr>
                <td>#${store.userStoreId}</td>
                <td>${store.merchantId || '—'}</td>
                <td>${store.storeName || '—'}</td>
                <td>${store.categoryId || '—'}</td>
                <td>${store.isDeleted ? '❌ Deleted' : '✅ Active'}</td>
                <td class="actions-cell">
                    <button class="btn-edit" onclick="editStore(${store.userStoreId})">Edit</button>
                    <button class="btn-delete" onclick="deleteStore(${store.userStoreId})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading stores:', error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #e74c3c;">Error: ${error.message}</td></tr>`;
        showToast(`Failed to load stores: ${error.message}`, 'error');
    }
}

// Edit store
async function editStore(id) {
    try {
        const response = await fetch(`${STORE_ENDPOINT}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch store');
        const store = await response.json();
        openModal(store);
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Delete store
async function deleteStore(id) {
    if (!confirm('Are you sure you want to delete this store?')) return;
    
    try {
        const response = await fetch(`${STORE_ENDPOINT}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        showToast('Store deleted successfully', 'success');
        loadStores();
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Submit form (Create or Update)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        merchantId: document.getElementById('merchantId').value.trim(),
        storeName: document.getElementById('storeName').value.trim(),
        inventoryId: parseInt(document.getElementById('inventoryId').value) || null,
        categoryId: parseInt(document.getElementById('categoryId').value) || null,
        createdBy: parseInt(document.getElementById('createdBy').value) || null,
        isDeleted: false,
        createdDate: new Date().toISOString()
    };
    
    if (!data.merchantId) {
        showToast('Merchant ID is required', 'error');
        return;
    }
    
    if (!data.storeName) {
        showToast('Store Name is required', 'error');
        return;
    }
    
    try {
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `${STORE_ENDPOINT}/${editingId}` : STORE_ENDPOINT;
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        showToast(`Store ${editingId ? 'updated' : 'created'} successfully`, 'success');
        closeModal();
        loadStores();
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

// Load stores on page load
document.addEventListener('DOMContentLoaded', loadStores);
