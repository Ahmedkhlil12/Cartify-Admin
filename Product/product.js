(() => {
  const API_BASE_URL = 'https://localhost:7212/api';
  const PRODUCT_ENDPOINT = `${API_BASE_URL}/Product`;

  const urlParams = new URLSearchParams(window.location.search);
  const filterStoreId = urlParams.get('storeId');

  const tableBody = document.getElementById('productTableBody');
  const modalBackdrop = document.getElementById('productModal');
  const modalTitle = document.getElementById('productModalTitle');
  const form = document.getElementById('productForm');
  const toast = document.getElementById('productToast');
  const addBtn = document.getElementById('addProductBtn');
  const closeBtn = document.getElementById('closeProductModal');
  const cancelBtn = document.getElementById('cancelProductModal');
  const pageTitle = document.getElementById('page-title');

  let editingProductId = null;

  // Ensure modal starts hidden
  if (modalBackdrop) {
    modalBackdrop.classList.remove('open');
  }

  const getAuthData = () => {
    try {
      return JSON.parse(localStorage.getItem('Auth')) ||
        JSON.parse(sessionStorage.getItem('Auth'));
    } catch (err) {
      console.warn('Cannot parse auth storage', err);
      return null;
    }
  };

  const buildHeaders = (withJson = true) => {
    const headers = {};
    if (withJson) headers['Content-Type'] = 'application/json';
    const auth = getAuthData();
    if (auth?.jwt) headers['Authorization'] = `Bearer ${auth.jwt}`;
    return headers;
  };

  const showToast = (message, type = 'info') => {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 3500);
  };

  const toggleModal = (open, product = null) => {
    if (!modalBackdrop) return;
    if (open) {
      modalBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
      populateForm(product);
    } else {
      modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
      form?.reset();
      if (form?.ProductId) form.ProductId.value = '';
      if (form?.IsDeleted) form.IsDeleted.checked = false;
      editingProductId = null;
    }
  };

  const normalizeProduct = (product) => {
    if (!product) return null;
    return {
      productId: product.productId ?? product.ProductId ?? null,
      typeId: product.typeId ?? product.TypeId ?? null,
      userStoreId: product.userStoreId ?? product.UserStoreId ?? null,
      productName: product.productName ?? product.ProductName ?? '',
      productDescription: product.productDescription ?? product.ProductDescription ?? '',
      isDeleted: product.isDeleted ?? product.IsDeleted ?? false,
      createdBy: product.createdBy ?? product.CreatedBy ?? null,
      createdDate: product.createdDate ?? product.CreatedDate ?? null,
      updatedBy: product.updatedBy ?? product.UpdatedBy ?? null,
      updatedDate: product.updatedDate ?? product.UpdatedDate ?? null,
      deletedBy: product.deletedBy ?? product.DeletedBy ?? null,
      deletedDate: product.deletedDate ?? product.DeletedDate ?? null
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

  const encodeProduct = (product) => encodeURIComponent(JSON.stringify(product));
  const decodeProduct = (encoded) => {
    try {
      return JSON.parse(decodeURIComponent(encoded));
    } catch {
      return null;
    }
  };

  const renderProducts = (products) => {
    if (!tableBody) return;
    if (!products.length) {
      setEmptyRow('No products found. Create the first one.');
      return;
    }

    tableBody.innerHTML = products.map((raw) => {
      const product = normalizeProduct(raw);
      const statusClass = product.isDeleted ? 'status-deleted' : 'status-active';
      const statusLabel = product.isDeleted ? 'Deleted' : 'Active';
      return `
        <tr data-product="${encodeProduct(product)}">
          <td>#${product.productId ?? '—'}</td>
          <td>${product.typeId ?? '—'}</td>
          <td>${product.userStoreId ?? '—'}</td>
          <td>${product.productName || '—'}</td>
          <td>${product.productDescription || '—'}</td>
          <td><span class="status-pill ${statusClass}">${statusLabel}</span></td>
          <td>
            <div class="meta-block">
              <span>${product.createdBy ?? '—'}</span>
              <small>${formatDate(product.createdDate)}</small>
            </div>
          </td>
          <td>
            <div class="meta-block">
              <span>${product.updatedBy ?? '—'}</span>
              <small>${formatDate(product.updatedDate)}</small>
            </div>
          </td>
          <td>
            <div class="meta-block">
              <span>${product.deletedBy ?? '—'}</span>
              <small>${formatDate(product.deletedDate)}</small>
            </div>
          </td>
          <td>
            <div class="actions">
              <button class="btn btn-edit" data-action="edit" type="button"><i class="fas fa-pen"></i></button>
              <button class="btn btn-delete" data-action="delete" type="button"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  };

  const fetchProducts = async () => {
    setEmptyRow('Loading products…');
    try {
      const response = await fetch(PRODUCT_ENDPOINT, { headers: buildHeaders(false) });
      if (!response.ok) throw new Error(`Failed to load products (${response.status})`);
      let data = await response.json();
      if (!Array.isArray(data)) data = [];

      if (filterStoreId) {
        data = data.filter((item) => {
          const product = normalizeProduct(item);
          return Number(product.userStoreId) === Number(filterStoreId);
        });
        if (pageTitle) pageTitle.textContent = `Products - Store #${filterStoreId}`;
      }

      renderProducts(data);
    } catch (error) {
      console.error('fetchProducts error', error);
      setEmptyRow('Unable to load products. Please try again.');
      showToast(error.message || 'Failed to load products', 'error');
    }
  };

  const toNullableInt = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  const toIso = (value) => (value ? new Date(value).toISOString() : null);
  const toInputValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 16);
  };

  const populateForm = (product) => {
    if (!form) return;
    if (!product) {
      form.reset();
      if (form.CreatedDate) form.CreatedDate.value = toInputValue(new Date());
      if (filterStoreId && form.UserStoreId) form.UserStoreId.value = filterStoreId;
      editingProductId = null;
      modalTitle.textContent = 'Add Product';
      return;
    }

    form.ProductId.value = product.productId ?? '';
    form.TypeId.value = product.typeId ?? '';
    form.UserStoreId.value = product.userStoreId ?? '';
    form.ProductName.value = product.productName ?? '';
    form.ProductDescription.value = product.productDescription ?? '';
    form.IsDeleted.checked = Boolean(product.isDeleted);
    form.CreatedBy.value = product.createdBy ?? '';
    form.CreatedDate.value = toInputValue(product.createdDate);
    form.UpdatedBy.value = product.updatedBy ?? '';
    form.UpdatedDate.value = toInputValue(product.updatedDate);
    form.DeletedBy.value = product.deletedBy ?? '';
    form.DeletedDate.value = toInputValue(product.deletedDate);

    editingProductId = product.productId;
    modalTitle.textContent = `Edit Product #${product.productId ?? ''}`;
  };

  const buildPayload = () => {
    if (!form) throw new Error('Form missing');
    const payload = {
      TypeId: toNullableInt(form.TypeId.value),
      UserStoreId: toNullableInt(form.UserStoreId.value),
      ProductName: form.ProductName.value.trim(),
      ProductDescription: form.ProductDescription.value.trim(),
      IsDeleted: form.IsDeleted.checked,
      CreatedBy: toNullableInt(form.CreatedBy.value),
      CreatedDate: toIso(form.CreatedDate.value),
      UpdatedBy: toNullableInt(form.UpdatedBy.value),
      UpdatedDate: toIso(form.UpdatedDate.value),
      DeletedBy: toNullableInt(form.DeletedBy.value),
      DeletedDate: toIso(form.DeletedDate.value)
    };

    if (!payload.TypeId) throw new Error('TypeId is required');
    if (!payload.UserStoreId) throw new Error('Store ID is required');
    if (!payload.ProductName) throw new Error('ProductName is required');
    if (!payload.ProductDescription) throw new Error('Description is required');
    if (!payload.CreatedDate) payload.CreatedDate = new Date().toISOString();

    if (editingProductId) payload.ProductId = editingProductId;
    return payload;
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    try {
      const payload = buildPayload();
      const method = editingProductId ? 'PUT' : 'POST';
      const url = editingProductId ? `${PRODUCT_ENDPOINT}/${editingProductId}` : PRODUCT_ENDPOINT;

      const response = await fetch(url, {
        method,
        headers: buildHeaders(true),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to ${editingProductId ? 'update' : 'create'} product`);
      }

      showToast(`Product ${editingProductId ? 'updated' : 'created'} successfully`, 'success');
      toggleModal(false);
      fetchProducts();
    } catch (error) {
      console.error('submitProduct error', error);
      showToast(error.message || 'Failed to save product', 'error');
    }
  };

  const deleteProduct = async (productId) => {
    if (!productId) return;
    if (!window.confirm('Delete this product permanently?')) return;

    try {
      const response = await fetch(`${PRODUCT_ENDPOINT}/${productId}`, {
        method: 'DELETE',
        headers: buildHeaders(false)
      });
      if (!response.ok) throw new Error(`Failed to delete product (${response.status})`);
      showToast('Product deleted', 'success');
      fetchProducts();
    } catch (error) {
      console.error('deleteProduct error', error);
      showToast(error.message || 'Failed to delete product', 'error');
    }
  };

  tableBody?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const row = button.closest('tr');
    const product = row?.dataset.product ? decodeProduct(row.dataset.product) : null;
    if (button.dataset.action === 'edit' && product) {
      toggleModal(true, product);
    } else if (button.dataset.action === 'delete' && product?.productId) {
      deleteProduct(product.productId);
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
  form?.addEventListener('submit', submitProduct);

  fetchProducts();
})();

