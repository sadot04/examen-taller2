import { sneakerService } from '../services/SneakerService.js';

export const InventoryView = {
  activeId: null,

  render(container) {
    container.innerHTML = `
      <div class="toolbar">
        <div class="search-filter-group">
          <input type="text" id="inventory-search" class="input-search" placeholder="🔍 Buscar por modelo, marca o SKU...">
          <select id="brand-filter" class="select-filter">
            <option value="ALL">Todas las marcas</option>
            <option value="Nike">Nike</option>
            <option value="Adidas">Adidas</option>
            <option value="New Balance">New Balance</option>
            <option value="Puma">Puma</option>
            <option value="Jordan">Jordan</option>
          </select>
        </div>
        <button id="btn-add-sneaker" class="btn btn-primary">
          <span>+</span> Nuevo Sneaker
        </button>
      </div>

      <div class="glass-panel">
        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Marca</th>
                <th>Talla (US)</th>
                <th>SKU</th>
                <th>Precio</th>
                <th>Stock</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody id="sneakers-table-body">
              <!-- Renderizado dinámico -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal de Alta y Edición -->
      <div id="sneaker-modal" class="modal-backdrop">
        <div class="modal-box">
          <div class="modal-header">
            <h3 id="modal-title">Agregar Nuevo Sneaker</h3>
            <button type="button" class="close-btn" id="btn-close-modal">&times;</button>
          </div>
          <form id="sneaker-form">
            <div class="modal-body">
              <div id="form-error-alert" class="form-errors"></div>
              
              <div class="form-grid">
                <div class="form-group">
                  <label>Marca *</label>
                  <input type="text" id="input-brand" class="form-control" placeholder="Ej: Nike" required>
                </div>
                <div class="form-group">
                  <label>Modelo *</label>
                  <input type="text" id="input-model" class="form-control" placeholder="Ej: Air Max 90" required>
                </div>
                <div class="form-group">
                  <label>SKU (Código único) *</label>
                  <input type="text" id="input-sku" class="form-control" placeholder="Ej: CD0881-100" required>
                </div>
                <div class="form-group">
                  <label>Categoría</label>
                  <select id="input-category" class="form-control">
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Running">Running</option>
                    <option value="Skate">Skate</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Talla (US) *</label>
                  <input type="number" id="input-size" step="0.5" class="form-control" placeholder="Ej: 10.5" required>
                </div>
                <div class="form-group">
                  <label>Precio ($USD) *</label>
                  <input type="number" id="input-price" step="0.01" class="form-control" placeholder="Ej: 150.00" required>
                </div>
                <div class="form-group">
                  <label>Stock Disponible *</label>
                  <input type="number" id="input-stock" class="form-control" placeholder="Ej: 8" required>
                </div>
                <div class="form-group">
                  <label>Colorway</label>
                  <input type="text" id="input-colorway" class="form-control" placeholder="Ej: Triple White">
                </div>
                <div class="form-group col-span-2">
                  <label>URL de Imagen</label>
                  <input type="url" id="input-image" class="form-control" placeholder="https://ejemplo.com/sneaker.jpg">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-modal">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btn-save-modal">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents();
    this.refreshTable();
  },

  bindEvents() {
    const searchInput = document.getElementById('inventory-search');
    const brandFilter = document.getElementById('brand-filter');
    const btnAdd = document.getElementById('btn-add-sneaker');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const form = document.getElementById('sneaker-form');

    searchInput?.addEventListener('input', () => this.refreshTable());
    brandFilter?.addEventListener('change', () => this.refreshTable());

    btnAdd?.addEventListener('click', () => this.openModal());
    btnCloseModal?.addEventListener('click', () => this.closeModal());
    btnCancelModal?.addEventListener('click', () => this.closeModal());

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });
  },

  refreshTable() {
    const search = document.getElementById('inventory-search')?.value || '';
    const brand = document.getElementById('brand-filter')?.value || '';
    const tbody = document.getElementById('sneakers-table-body');
    if (!tbody) return;

    const sneakers = sneakerService.getAll({ search, brand });

    if (sneakers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">
            No se encontraron pares en el inventario con los criterios seleccionados.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = sneakers.map(s => `
      <tr>
        <td>
          <div class="product-cell">
            <img src="${s.imageUrl}" alt="${s.model}" class="product-thumbnail" onerror="this.src='https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=400&q=80'">
            <div>
              <div style="font-weight: 600; color: var(--text-primary);">${s.model}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${s.colorway} &bull; ${s.category}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-brand">${s.brand}</span></td>
        <td><strong>US ${s.size}</strong></td>
        <td><code>${s.sku}</code></td>
        <td><strong>$${s.price.toFixed(2)}</strong></td>
        <td>
          <span class="badge ${s.stock <= 3 ? 'badge-stock-low' : 'badge-stock-ok'}">
            ${s.stock} un.
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.inventoryModule.edit('${s.id}')">Editar</button>
            <button class="btn btn-danger btn-sm" onclick="window.inventoryModule.delete('${s.id}')">Eliminar</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openModal(sneaker = null) {
    const modal = document.getElementById('sneaker-modal');
    const modalTitle = document.getElementById('modal-title');
    const errorAlert = document.getElementById('form-error-alert');
    
    errorAlert.style.display = 'none';
    errorAlert.innerHTML = '';

    if (sneaker) {
      this.activeId = sneaker.id;
      modalTitle.textContent = 'Editar Sneaker';
      document.getElementById('input-brand').value = sneaker.brand;
      document.getElementById('input-model').value = sneaker.model;
      document.getElementById('input-sku').value = sneaker.sku;
      document.getElementById('input-category').value = sneaker.category;
      document.getElementById('input-size').value = sneaker.size;
      document.getElementById('input-price').value = sneaker.price;
      document.getElementById('input-stock').value = sneaker.stock;
      document.getElementById('input-colorway').value = sneaker.colorway;
      document.getElementById('input-image').value = sneaker.imageUrl;
    } else {
      this.activeId = null;
      modalTitle.textContent = 'Agregar Nuevo Sneaker';
      document.getElementById('sneaker-form').reset();
    }

    modal.classList.add('open');
  },

  closeModal() {
    const modal = document.getElementById('sneaker-modal');
    modal.classList.remove('open');
    this.activeId = null;
  },

  handleFormSubmit() {
    const payload = {
      brand: document.getElementById('input-brand').value,
      model: document.getElementById('input-model').value,
      sku: document.getElementById('input-sku').value,
      category: document.getElementById('input-category').value,
      size: parseFloat(document.getElementById('input-size').value),
      price: parseFloat(document.getElementById('input-price').value),
      stock: parseInt(document.getElementById('input-stock').value, 10),
      colorway: document.getElementById('input-colorway').value,
      imageUrl: document.getElementById('input-image').value || undefined
    };

    let result;
    if (this.activeId) {
      result = sneakerService.update(this.activeId, payload);
    } else {
      result = sneakerService.create(payload);
    }

    if (result.success) {
      this.closeModal();
      this.refreshTable();
    } else {
      const errorAlert = document.getElementById('form-error-alert');
      errorAlert.innerHTML = result.errors.join('<br>');
      errorAlert.style.display = 'block';
    }
  },

  edit(id) {
    const sneaker = sneakerService.getById(id);
    if (sneaker) {
      this.openModal(sneaker);
    }
  },

  delete(id) {
    const sneaker = sneakerService.getById(id);
    if (sneaker && confirm(`¿Estás seguro de eliminar "${sneaker.brand} - ${sneaker.model}"?`)) {
      sneakerService.delete(id);
      this.refreshTable();
    }
  }
};

// Asignar al objeto global para callbacks de botones en tabla
window.inventoryModule = InventoryView;
