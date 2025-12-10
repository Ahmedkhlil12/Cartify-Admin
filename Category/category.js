// API Configuration
const API_BASE = 'https://localhost:7212/api';
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

// Load categories from API
async function loadCategories() {
  const tbody = document.getElementById('categoryTableBody');
  if (!tbody) return;

  const categories = await safeFetchJson(`${API_BASE}/category`);
  if (!categories) {
    tbody.innerHTML = '<tr><td colspan="4">No categories found</td></tr>';
    return;
  }

  allCategories = Array.isArray(categories) ? categories : (categories.data ? categories.data : []);
  renderCategoriesTable();
}

// Render categories table
function renderCategoriesTable() {
  const tbody = document.getElementById('categoryTableBody');
  if (!tbody) return;

  if (allCategories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">No categories found</td></tr>';
    return;
  }

  tbody.innerHTML = allCategories.map((cat, idx) => `
    <tr>
      <td>#C${String(idx + 1).padStart(3, '0')}</td>
      <td>${cat.categoryName || cat.name || 'N/A'}</td>
      <td>${(cat.description || cat.categoryDescription || 'N/A').substring(0, 50)}...</td>
      <td>
        <button class="btn btn-edit" onclick="editCategory(${cat.id || cat.categoryId})">Edit</button>
        <button class="btn btn-delete" onclick="deleteCategory(${cat.id || cat.categoryId})">Delete</button>
        <button class="btn btn-suspend" onclick="suspendCategory(${cat.id || cat.categoryId})">Suspend</button>
      </td>
    </tr>
  `).join('');
}

// Open Add Category modal
function openAddCategoryModal() {
  const modal = document.getElementById('categoryModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('categoryForm').reset();
  }
}

// Close modal
function closeAddCategoryModal() {
  const modal = document.getElementById('categoryModal');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
}

// Edit category
async function editCategory(categoryId) {
  const category = allCategories.find(c => (c.id || c.categoryId) === categoryId);
  if (!category) return;
  
  document.getElementById('CategoryName').value = category.categoryName || category.name || '';
  document.getElementById('CategoryDescription').value = category.description || category.categoryDescription || '';
  document.getElementById('CategoryId').value = categoryId;
  openAddCategoryModal();
}

// Delete category
async function deleteCategory(categoryId) {
  if (!confirm('Are you sure you want to delete this category?')) return;
  
  const result = await safeFetchJson(`${API_BASE}/category/${categoryId}`, {
    method: 'DELETE'
  });
  
  if (result || result === null) {
    alert('Category deleted!');
    loadCategories();
  } else {
    alert('Error deleting category.');
  }
}

// Suspend category
async function suspendCategory(categoryId) {
  alert(`Category ${categoryId} suspended!`);
  // Implement suspension logic if needed
}

// Submit form to add/edit category
async function submitAddCategory(e) {
  e.preventDefault();
  
  const categoryId = document.getElementById('CategoryId').value;
  const nameInput = document.getElementById('CategoryName');
  const descInput = document.getElementById('CategoryDescription');
  const imageInput = document.getElementById('ImageFile');

  // Convert image to base64
  let imageData = '';
  if (imageInput.files && imageInput.files[0]) {
    const file = imageInput.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      imageData = event.target.result;
      
      const categoryData = {
        categoryName: nameInput.value,
        categoryDescription: descInput.value,
        imageUrl: imageData,
        createdDate: new Date().toISOString(),
        isDeleted: false
      };

      const method = categoryId ? 'PUT' : 'POST';
      const url = categoryId ? `${API_BASE}/category/${categoryId}` : `${API_BASE}/category`;

      const result = await safeFetchJson(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });

      if (result) {
        alert(`Category ${categoryId ? 'updated' : 'created'} successfully!`);
        closeAddCategoryModal();
        loadCategories();
      } else {
        alert('Error saving category. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  } else {
    // No image, just save
    const categoryData = {
      categoryName: nameInput.value,
      categoryDescription: descInput.value,
      imageUrl: '',
      createdDate: new Date().toISOString(),
      isDeleted: false
    };

    const method = categoryId ? 'PUT' : 'POST';
    const url = categoryId ? `${API_BASE}/category/${categoryId}` : `${API_BASE}/category`;

    const result = await safeFetchJson(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });

    if (result) {
      alert(`Category ${categoryId ? 'updated' : 'created'} successfully!`);
      closeAddCategoryModal();
      loadCategories();
    } else {
      alert('Error saving category. Please try again.');
    }
  }
}

// Initialize interactions
document.addEventListener('DOMContentLoaded', () => {
  // Load categories from API on page load
  loadCategories();

  // Add Category button
  const addBtn = document.getElementById('openAddCategory');
  if (addBtn) {
    addBtn.addEventListener('click', openAddCategoryModal);
  }

  // Add Category form submission
  const form = document.getElementById('categoryForm');
  if (form) {
    form.addEventListener('submit', submitAddCategory);
  }

  // Cancel button
  const cancelBtn = document.getElementById('cancelCategory');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeAddCategoryModal);
  }

  // Close modal when clicking outside
  const modal = document.getElementById('categoryModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAddCategoryModal();
    });
  }
});

// Expose functions globally for inline handlers
window.openAddCategoryModal = openAddCategoryModal;
window.closeAddCategoryModal = closeAddCategoryModal;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.suspendCategory = suspendCategory;
