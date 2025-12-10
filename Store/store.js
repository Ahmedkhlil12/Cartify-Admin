(() => {
  const API_BASE_URL = 'https://localhost:7212/api';
  const STORE_ENDPOINT = `${API_BASE_URL}/UserStore`;

  const tableBody = document.getElementById('storeTableBody');
  const modalBackdrop = document.getElementById('storeModal');
  const modalTitle = document.getElementById('storeModalTitle');
  const form = document.getElementById('storeForm');
  const toast = document.getElementById('storeToast');
  const addBtn = document.getElementById('addStoreBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelModalBtn');

  let editingStoreId = null;

  const getAuthData = () => {
    try {
      return JSON.parse(localStorage.getItem('Auth')) ||
        JSON.parse(sessionStorage.getItem('Auth'));
    } catch (err) {
      console.warn('Cannot parse Auth storage', err);
      return null;
    }
  };

  const buildHeaders = (isJson = true) => {
    const headers = {};
    if (isJson) headers['Content-Type'] = 'application/json';
    const auth = getAuthData();
    if (auth?.jwt) headers['Authorization'] = `Bearer ${auth.jwt}`;
    return headers;
  };

  const showToast = (message, type = 'info') => {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  };

  const toggleModal = (open, storeData = null) => {
    if (!modalBackdrop) return;
    if (open) {
      modalBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
      populateForm(storeData);
    } else {
      modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
      form?.reset();
      if (form?.UserStoreId) form.UserStoreId.value = '';
      if (form?.IsDeleted) form.IsDeleted.checked = false;
      editingStoreId = null;
    }
  };

  const normalizeStore = (store) => {
    if (!store) return null;
    return {
      userStoreId: store.userStoreId ?? store.UserStoreId ?? null,
      merchantId: store.merchantId ?? store.MerchantId ?? '',
      storeName: store.storeName ?? store.StoreName ?? '',
      inventoryId: store.inventoryId ?? store.InventoryId ?? null,
      categoryId: store.categoryId ?? store.CategoryId ?? null,
      isDeleted: store.isDeleted ?? store.IsDeleted ?? false,
      createdBy: store.createdBy ?? store.CreatedBy ?? null,
      createdDate: store.createdDate ?? store.CreatedDate ?? null,
      updatedBy: store.updatedBy ?? store.UpdatedBy ?? null,
      updatedDate: store.updatedDate ?? store.UpdatedDate ?? null,
      deletedBy: store.deletedBy ?? store.DeletedBy ?? null,
      deletedDate: store.deletedDate ?? store.DeletedDate ?? null
    };
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const setEmptyRow = (message) => {
    if (!tableBody) return;
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" class="empty-row">${message}</td>
      </tr>
    `;
  };

  const encodeStore = (store) => encodeURIComponent(JSON.stringify(store));
  const decodeStore = (datasetValue) => {
    try {
      return JSON.parse(decodeURIComponent(datasetValue));
    } catch {
      return null;
    }
  };

  const renderStores = (stores) => {
    if (!tableBody) return;
    if (!stores.length) {
      setEmptyRow('No stores found. Create the first one.');
      return;
    }

    tableBody.innerHTML = stores.map((raw) => {
      const store = normalizeStore(raw);
      const statusClass = store.isDeleted ? 'status-deleted' : 'status-active';
      const statusLabel = store.isDeleted ? 'Deleted' : 'Active';
      return `
        <tr data-store="${encodeStore(store)}">
          <td>#${store.userStoreId ?? '—'}</td>
          <td>${store.merchantId || '—'}</td>
          <td>${store.storeName || '—'}</td>
          <td>${store.inventoryId ?? '—'}</td>
          <td>${store.categoryId ?? '—'}</td>
          <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
          <td>
            <div class="meta-block">
              <span>${store.createdBy ?? '—'}</span>
              <small>${formatDate(store.createdDate)}</small>
            </div>
          </td>
          <td>
            <div class="meta-block">
              <span>${store.updatedBy ?? '—'}</span>
              <small>${formatDate(store.updatedDate)}</small>
            </div>
          </td>
          <td>
            <div class="meta-block">
              <span>${store.deletedBy ?? '—'}</span>
              <small>${formatDate(store.deletedDate)}</small>
            </div>
          </td>
          <td>
            <div class="actions">
              <a class="btn btn-view" href="/Product/Prodcut.html?storeId=${store.userStoreId ?? ''}" target="_blank" rel="noopener">View</a>
              <button class="btn btn-edit" data-action="edit" type="button"><i class="fas fa-pen"></i></button>
              <button class="btn btn-delete" data-action="delete" type="button"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  };

  const fetchStores = async () => {
    setEmptyRow('Loading stores…');
    try {
      const response = await fetch(STORE_ENDPOINT, { headers: buildHeaders(false) });
      if (!response.ok) throw new Error(`Failed to load stores (${response.status})`);
      const data = await response.json();
      renderStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('fetchStores error', error);
      setEmptyRow('Unable to load stores. Please try again.');
      showToast(error.message || 'Failed to load stores', 'error');
    }
  };

  const toNullableInt = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  const toIso = (value) => value ? new Date(value).toISOString() : null;
  const toInputValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const iso = date.toISOString();
    return iso.slice(0, 16);
  };

  const populateForm = (store) => {
    if (!form) return;
    if (!store) {
      form.reset();
      if (form.CreatedDate) form.CreatedDate.value = toInputValue(new Date());
      if (form.IsDeleted) form.IsDeleted.checked = false;
      editingStoreId = null;
      modalTitle.textContent = 'Add Store';
      return;
    }

    form.UserStoreId.value = store.userStoreId ?? '';
    form.MerchantId.value = store.merchantId ?? '';
    form.StoreName.value = store.storeName ?? '';
    form.InventoryId.value = store.inventoryId ?? '';
    form.CategoryId.value = store.categoryId ?? '';
    form.IsDeleted.checked = Boolean(store.isDeleted);
    form.CreatedBy.value = store.createdBy ?? '';
    form.CreatedDate.value = toInputValue(store.createdDate);
    form.UpdatedBy.value = store.updatedBy ?? '';
    form.UpdatedDate.value = toInputValue(store.updatedDate);
    form.DeletedBy.value = store.deletedBy ?? '';
    form.DeletedDate.value = toInputValue(store.deletedDate);

    editingStoreId = store.userStoreId;
    modalTitle.textContent = `Edit Store #${store.userStoreId ?? ''}`;
  };

  const buildPayload = () => {
    if (!form) throw new Error('Form missing');
    const payload = {
      MerchantId: form.MerchantId.value.trim(),
      StoreName: form.StoreName.value.trim(),
      InventoryId: toNullableInt(form.InventoryId.value),
      CategoryId: toNullableInt(form.CategoryId.value),
      IsDeleted: form.IsDeleted.checked,
      CreatedBy: toNullableInt(form.CreatedBy.value),
      CreatedDate: toIso(form.CreatedDate.value),
      UpdatedBy: toNullableInt(form.UpdatedBy.value),
      UpdatedDate: toIso(form.UpdatedDate.value),
      DeletedBy: toNullableInt(form.DeletedBy.value),
      DeletedDate: toIso(form.DeletedDate.value)
    };

    if (!payload.MerchantId) throw new Error('MerchantId is required');
    if (!payload.StoreName) throw new Error('StoreName is required');
    if (!payload.CreatedBy) throw new Error('CreatedBy is required');
    if (!payload.CreatedDate) payload.CreatedDate = new Date().toISOString();

    if (editingStoreId) payload.UserStoreId = editingStoreId;

    return payload;
  };

  const submitStore = async (event) => {
    event.preventDefault();
    try {
      const payload = buildPayload();
      const method = editingStoreId ? 'PUT' : 'POST';
      const url = editingStoreId ? `${STORE_ENDPOINT}/${editingStoreId}` : STORE_ENDPOINT;

      const response = await fetch(url, {
        method,
        headers: buildHeaders(true),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to ${editingStoreId ? 'update' : 'create'} store`);
      }

      showToast(`Store ${editingStoreId ? 'updated' : 'created'} successfully`, 'success');
      toggleModal(false);
      fetchStores();
    } catch (error) {
      console.error('submitStore error', error);
      showToast(error.message || 'Failed to save store', 'error');
    }
  };

  const deleteStore = async (storeId) => {
    if (!storeId) return;
    const confirmDelete = window.confirm('Delete this store permanently?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${STORE_ENDPOINT}/${storeId}`, {
        method: 'DELETE',
        headers: buildHeaders(false)
      });
      if (!response.ok) throw new Error(`Failed to delete store (${response.status})`);
      showToast('Store deleted', 'success');
      fetchStores();
    } catch (error) {
      console.error('deleteStore error', error);
      showToast(error.message || 'Failed to delete store', 'error');
    }
  };

  tableBody?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const row = button.closest('tr');
    const storeData = row?.dataset.store ? decodeStore(row.dataset.store) : null;
    if (button.dataset.action === 'edit' && storeData) {
      toggleModal(true, storeData);
    } else if (button.dataset.action === 'delete' && storeData?.userStoreId) {
      deleteStore(storeData.userStoreId);
    }
  });

  addBtn?.addEventListener('click', () => toggleModal(true, null));
  closeBtn?.addEventListener('click', () => toggleModal(false));
  cancelBtn?.addEventListener('click', () => toggleModal(false));
  modalBackdrop?.addEventListener('click', (event) => {
    if (event.target === modalBackdrop) toggleModal(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') toggleModal(false);
  });
  form?.addEventListener('submit', submitStore);

  fetchStores();
})();

