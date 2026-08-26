import { sneakerService } from '../services/SneakerService.js';

export const InventoryView = {
  activeId: null,

  render(container) {
    container.innerHTML = `
      <div class="toolbar">
        <div class="search-filter-group">
          <input type="text" id="inventory-search" class="input-search" placeholder="🔍 Buscar por modelo, marca, color o SKU...">
          <select id="brand-filter" class="select-filter">
            <option value="ALL">Todas las marcas</option>
            <option value="Nike">Nike</option>
            <option value="Adidas">Adidas</option>
            <option value="New Balance">New Balance</option>
            <option value="Puma">Puma</option>
            <option value="Jordan">Jordan</option>
          </select>
          <select id="category-filter" class="select-filter">
            <option value="ALL">Todas las categorías</option>
            <option value="Basketball">Basketball</option>
            <option value="Lifestyle">Lifestyle</option>
            <option value="Running">Running</option>
            <option value="Skate">Skate</option>
          </select>
        </div>
        <button id="btn-add-sneaker" class="btn btn-primary">
          <span>+</span> Registrar Sneaker
        </button>
      </div>

      <div class="glass-panel">
        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Modelo y Foto</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>SKU</th>
                <th>Talla</th>
                <th>Color</th>
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

      <!-- Modal de Formulario ABM (Alta / Modificación) -->
      <div id="sneaker-modal" class="modal-backdrop">
        <div class="modal-box">
          <div class="modal-header">
            <h3 id="modal-title">Registrar Nuevo Sneaker</h3>
            <button type="button" class="close-btn" id="btn-close-modal">&times;</button>
          </div>
          <form id="sneaker-form" novalidate>
            <div class="modal-body">
              <div id="form-error-alert" class="form-errors"></div>
              
              <div class="form-grid">
                <div class="form-group">
                  <label for="input-modelo">Modelo *</label>
                  <input type="text" id="input-modelo" class="form-control" placeholder="Ej: Air Jordan 1 Retro" required>
                  <small class="field-help" style="color: var(--text-muted); font-size: 0.75rem;">Nombre descriptivo del modelo</small>
                </div>
                <div class="form-group">
                  <label for="input-marca">Marca *</label>
                  <input type="text" id="input-marca" class="form-control" placeholder="Ej: Nike" required>
                  <small class="field-help" style="color: var(--text-muted); font-size: 0.75rem;">Fabricante o marca oficial</small>
                </div>
                <div class="form-group">
                  <label for="input-sku">SKU (Código Único) *</label>
                  <input type="text" id="input-sku" class="form-control" placeholder="Ej: DZ5485-612" required>
                  <small class="field-help" style="color: var(--text-muted); font-size: 0.75rem;">Identificador comercial único</small>
                </div>
                <div class="form-group">
                  <label for="input-categoria">Categoría</label>
                  <select id="input-categoria" class="form-control">
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Running">Running</option>
                    <option value="Skate">Skate</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="input-talla">Talla (Número) *</label>
                  <input type="number" id="input-talla" step="0.5" min="1" max="20" class="form-control" placeholder="Ej: 10.5" required>
                  <small class="field-help" style="color: var(--text-muted); font-size: 0.75rem;">Talla numérica (ej: 8.5, 9, 10)</small>
                </div>
                <div class="form-group">
                  <label for="input-color">Color / Colorway *</label>
                  <input type="text" id="input-color" class="form-control" placeholder="Ej: Blanco / Rojo Chicago" required>
                  <small class="field-help" style="color: var(--text-muted); font-size: 0.75rem;">Combinación cromática</small>
                </div>
                <div class="form-group">
                  <label for="input-precio">Precio ($USD) *</label>
                  <input type="number" id="input-precio" step="0.01" min="1" class="form-control" placeholder="Ej: 180.00" required>
                  <small class="field-help" style="color: var(--text-muted); font-size: 0.75rem;">Valor numérico mayor a 0</small>
                </div>
                <div class="form-group">
                  <label for="input-stock">Stock (Número) *</label>
                  <input type="number" id="input-stock" step="1" min="0" class="form-control" placeholder="Ej: 12" required>
                  <small class="field-help" style="color: var(--text-muted); font-size: 0.75rem;">Cantidad en inventario (&ge; 0)</small>
                </div>
                <div class="form-group col-span-2">
                  <label for="input-imagen">URL de Imagen (Opcional)</label>
                  <input type="url" id="input-imagen" class="form-control" placeholder="https://ejemplo.com/sneaker.jpg">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-modal">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btn-save-modal">Guardar Sneaker</button>
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
    const categoryFilter = document.getElementById('category-filter');
    const btnAdd = document.getElementById('btn-add-sneaker');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const form = document.getElementById('sneaker-form');

    searchInput?.addEventListener('input', () => this.refreshTable());
    brandFilter?.addEventListener('change', () => this.refreshTable());
    categoryFilter?.addEventListener('change', () => this.refreshTable());

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
    const marca = document.getElementById('brand-filter')?.value || '';
    const categoria = document.getElementById('category-filter')?.value || '';
    const tbody = document.getElementById('sneakers-table-body');
    if (!tbody) return;

    // Llamada a la función de listado con filtros de búsqueda, marca y categoría
    const sneakers = sneakerService.listar({ search, marca, categoria });

    if (sneakers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 36px;">
            No se encontraron sneakers en el inventario que coincidan con la búsqueda.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = sneakers.map(s => `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.8rem; font-family: monospace;">#${s.id}</td>
        <td>
          <div class="product-cell">
            <img src="${s.imageUrl}" alt="${s.modelo}" class="product-thumbnail" onerror="this.src='https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=400&q=80'">
            <div>
              <div style="font-weight: 600; color: var(--text-primary);">${s.modelo}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${s.color}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-brand">${s.marca}</span></td>
        <td><span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary);">${s.categoria}</span></td>
        <td><code>${s.sku}</code></td>
        <td><strong>US ${s.talla}</strong></td>
        <td><span style="color: var(--text-secondary);">${s.color}</span></td>
        <td><strong style="color: #fff;">$${s.precio.toFixed(2)}</strong></td>
        <td>
          <span class="badge ${s.stock <= 3 ? 'badge-stock-low' : 'badge-stock-ok'}">
            ${s.stock} pares
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.inventoryModule.edit('${s.id}')" title="Editar este sneaker">
              ✏️ Editar
            </button>
            <button class="btn btn-danger btn-sm" onclick="window.inventoryModule.delete('${s.id}')" title="Eliminar este sneaker">
              🗑️ Eliminar
            </button>
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
      modalTitle.textContent = `Editar Sneaker (#${sneaker.id})`;
      document.getElementById('input-modelo').value = sneaker.modelo;
      document.getElementById('input-marca').value = sneaker.marca;
      document.getElementById('input-sku').value = sneaker.sku;
      document.getElementById('input-categoria').value = sneaker.categoria || 'Lifestyle';
      document.getElementById('input-talla').value = sneaker.talla;
      document.getElementById('input-color').value = sneaker.color;
      document.getElementById('input-precio').value = sneaker.precio;
      document.getElementById('input-stock').value = sneaker.stock;
      document.getElementById('input-imagen').value = sneaker.imageUrl;
    } else {
      this.activeId = null;
      modalTitle.textContent = 'Registrar Nuevo Sneaker';
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
    const modelo = document.getElementById('input-modelo').value;
    const marca = document.getElementById('input-marca').value;
    const sku = document.getElementById('input-sku').value;
    const categoria = document.getElementById('input-categoria').value;
    const talla = parseFloat(document.getElementById('input-talla').value);
    const color = document.getElementById('input-color').value;
    const precio = parseFloat(document.getElementById('input-precio').value);
    const stock = parseInt(document.getElementById('input-stock').value, 10);
    const imageUrl = document.getElementById('input-imagen').value;

    const payload = {
      modelo,
      marca,
      sku,
      categoria,
      talla,
      color,
      precio,
      stock,
      imageUrl: imageUrl || undefined
    };

    let result;
    if (this.activeId) {
      // Actualizar registro existente
      result = sneakerService.actualizar(this.activeId, payload);
    } else {
      // Crear nuevo registro
      result = sneakerService.crear(payload);
    }

    if (result.success) {
      this.closeModal();
      this.refreshTable();
    } else {
      const errorAlert = document.getElementById('form-error-alert');
      errorAlert.innerHTML = `<strong>Por favor corrige los siguientes errores:</strong><br>&bull; ${result.errors.join('<br>&bull; ')}`;
      errorAlert.style.display = 'block';
    }
  },

  edit(id) {
    // Buscar por ID
    const sneaker = sneakerService.buscarPorId(id);
    if (sneaker) {
      this.openModal(sneaker);
    }
  },

  delete(id) {
    const sneaker = sneakerService.buscarPorId(id);
    if (sneaker && confirm(`¿Confirmas que deseas eliminar el sneaker "${sneaker.marca} - ${sneaker.modelo}" (SKU: ${sneaker.sku})?`)) {
      sneakerService.eliminar(id);
      this.refreshTable();
    }
  }
};

window.inventoryModule = InventoryView;
