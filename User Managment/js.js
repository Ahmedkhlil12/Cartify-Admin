// Global variables
const API_BASE = 'https://localhost:7212/api';
let allUsers = [];

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

// Load users from API
async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  const users = await safeFetchJson(`${API_BASE}/users`);
  if (!users) {
    tbody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
    return;
  }

  allUsers = Array.isArray(users) ? users : (users.data ? users.data : []);
  renderUsersTable();
}

// Render users table
function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (allUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
    return;
  }

  tbody.innerHTML = allUsers.map((user, idx) => `
    <tr>
      <td>#${String(idx + 1).padStart(3, '0')}</td>
      <td>${user.name || user.userName || 'N/A'}</td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.role || 'N/A'}</td>
      <td>${user.mobile || 'N/A'}</td>
      <td>
        <button class="btn btn-edit" data-id="${user.id}" onclick="editUser(${user.id})"><i class="fas fa-pen"></i></button>
        <button class="btn btn-delete" data-id="${user.id}" onclick="deleteUser(${user.id})"><i class="fas fa-trash"></i></button>
        <button class="btn btn-suspend" data-id="${user.id}" onclick="suspendUser(${user.id})"><i class="fas fa-ban"></i></button>
        <button class="btn btn-view" data-id="${user.id}" onclick="viewUser(${user.id})"><i class="fas fa-eye"></i></button>
      </td>
    </tr>
  `).join('');
}

// View user details
function viewUser(userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;

  const modal = document.getElementById('userModal');
  if (!modal) return;

  const tabs = modal.querySelectorAll('.tab-content');
  if (tabs.length >= 3) {
    // Personal Info
    tabs[0].innerHTML = `
      <div class="info-grid">
        <div><strong>Name:</strong> ${user.name || user.userName || 'N/A'}</div>
        <div><strong>Email:</strong> ${user.email || 'N/A'}</div>
        <div><strong>Mobile:</strong> ${user.mobile || 'N/A'}</div>
        <div><strong>Role:</strong> ${user.role || 'N/A'}</div>
      </div>
    `;

    // Security (demo)
    tabs[1].innerHTML = `
      <div>
        <p><strong>Status:</strong> Active</p>
        <p><strong>Last Login:</strong> 2025-11-25</p>
      </div>
    `;

    // Addresses
    tabs[2].innerHTML = `
      <ul>
        <li>${user.address || 'No address'}</li>
      </ul>
    `;
  }

  modal.classList.add('show');
}

// Open modal and populate content from data attributes on the clicked button
function openModal(triggerButton) {
  try {
    const modal = document.getElementById('userModal');
    if (!modal) return;

    // Tab containers
    const tabs = modal.querySelectorAll('.tab-content');
    if (tabs.length >= 3) {
      const email = triggerButton.dataset.email || '';
      const mobile = triggerButton.dataset.mobile || '';
      const birthdate = triggerButton.dataset.birthdate || '';
      const gender = triggerButton.dataset.gender || '';
      const role = triggerButton.dataset.role || '';
      const permission = triggerButton.dataset.permission || '';
      const address1 = triggerButton.dataset.address1 || '';
      const address2 = triggerButton.dataset.address2 || '';

      // Personal Info
      tabs[0].innerHTML = `
        <div class="info-grid">
          <div><strong>Email:</strong> ${email}</div>
          <div><strong>Mobile:</strong> ${mobile}</div>
          <div><strong>Birthdate:</strong> ${birthdate}</div>
          <div><strong>Gender:</strong> ${gender}</div>
          <div><strong>Role:</strong> ${role}</div>
          <div><strong>Permissions:</strong> ${permission}</div>
        </div>
      `;

      // Security (demo)
      tabs[1].innerHTML = `
        <div>
          <p><strong>2FA:</strong> Enabled</p>
          <p><strong>Last Password Change:</strong> 2025-06-12</p>
        </div>
      `;

      // Addresses
      tabs[2].innerHTML = `
        <ul>
          <li>${address1}</li>
          <li>${address2}</li>
        </ul>
      `;
    }

    modal.classList.add('show');
  } catch (e) {
    console.error('openModal error:', e);
  }
}

// Close modals
function closeModal() {
  const modal = document.getElementById('userModal');
  if (modal) modal.classList.remove('show');
}

function closeAddUserModal() {
  const modal = document.getElementById('addUserModal');
  if (modal) modal.classList.remove('open');
  document.getElementById('addUserForm')?.reset();
}

function openAddUserModal() {
  const modal = document.getElementById('addUserModal');
  if (modal) modal.classList.add('open');
}

// Submit form to add user
async function submitAddUser(e) {
  e.preventDefault();
  const nameInput = document.getElementById('userName');
  const emailInput = document.getElementById('userEmail');
  const mobileInput = document.getElementById('userMobile');
  const roleInput = document.getElementById('userRole');
  const passwordInput = document.getElementById('userPassword');

  const userData = {
    userName: nameInput.value,
    email: emailInput.value,
    mobile: mobileInput.value,
    role: roleInput.value,
    passwordHash: passwordInput.value
  };

  const result = await safeFetchJson(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (result) {
    alert('User created successfully!');
    closeAddUserModal();
    loadUsers();
  } else {
    alert('Error creating user. Please try again.');
  }
}

// Delete user
async function deleteUser(userId) {
  if (!confirm('Delete this user?')) return;
  const result = await safeFetchJson(`${API_BASE}/users/${userId}`, {
    method: 'DELETE'
  });
  if (result || (result === null)) {
    alert('User deleted!');
    loadUsers();
  } else {
    alert('Error deleting user.');
  }
}

// Edit user (placeholder)
function editUser(userId) {
  alert('Edit user ' + userId + ' (not yet implemented)');
}

// Suspend user (placeholder)
function suspendUser(userId) {
  alert('Suspend user ' + userId + ' (not yet implemented)');
}

// Initialize interactions once per page
document.addEventListener('DOMContentLoaded', () => {
  // Load users from API on page load
  loadUsers();

  // Tab switching inside modal
  const modal = document.getElementById('userModal');
  if (modal) {
    const tabButtons = modal.querySelectorAll('.tab-btn');
    const tabContents = modal.querySelectorAll('.tab-content');
    tabButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        if (tabContents[idx]) tabContents[idx].classList.add('active');
      });
    });

    // Close when clicking outside content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Add User button
  const addBtn = document.querySelector('.btn-add');
  if (addBtn) {
    addBtn.addEventListener('click', openAddUserModal);
  }

  // Add User form submission
  const form = document.getElementById('addUserForm');
  if (form) {
    form.addEventListener('submit', submitAddUser);
  }

  // Close modal when clicking outside
  const addUserModal = document.getElementById('addUserModal');
  if (addUserModal) {
    addUserModal.addEventListener('click', (e) => {
      if (e.target === addUserModal) closeAddUserModal();
    });
  }
});

// Expose functions globally for inline handlers in HTML
window.openModal = openModal;
window.closeModal = closeModal;
window.closeAddUserModal = closeAddUserModal;
window.openAddUserModal = openAddUserModal;
window.viewUser = viewUser;
window.deleteUser = deleteUser;
window.editUser = editUser;
window.suspendUser = suspendUser;


