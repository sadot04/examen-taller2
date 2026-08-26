import { saleService } from '../services/SaleService.js';
import { sneakerService } from '../services/SneakerService.js';

export const SalesView = {
  activeId: null,

  render(container) {
    container.innerHTML = `
      <div class="toolbar">
        <div class="search-filter-group">
          <input type="text" id="sales-search" class="input-search" placeholder="🔍 Buscar por cliente o modelo de sneaker...">
          <input type="date" id="sales-date-filter" class="select-filter" style="max-width: 170px;">
        </div>
        <button id="btn-add-sale" class="btn btn-primary">
          <span>+</span> Registrar Venta
        </button>
      </div>

      <div class="glass-panel">
        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>N° Venta</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Sneaker Vendido</th>
                <th>Cant.</th>
                <th>P. Unitario</th>
                <th>Total</th>
                <th style="text-align: right;">Acciones</th>
              </tr>
            </thead>
            <tbody id="sales-table-body">
              <!-- Renderizado dinámico -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal de Formulario ABM de Ventas -->
      <div id="sale-modal" class="modal-backdrop">
        <div class="modal-box">
          <div class="modal-header">
            <h3 id="sale-modal-title">Registrar Nueva Venta</h3>
            <button type="button" class="close-btn" id="btn-close-sale-modal">&times;</button>
          </div>
          <form id="sale-form" novalidate>
            <div class="modal-body">
              <div id="sale-form-error-alert" class="form-errors"></div>
              
              <div class="form-grid">
                <div class="form-group col-span-2">
                  <label for="sale-input-cliente">Nombre del Cliente *</label>
                  <input type="text" id="sale-input-cliente" class="form-control" placeholder="Ej: Santiago Alarcón" required>
                </div>

                <div class="form-group">
                  <label for="sale-input-fecha">Fecha de Venta *</label>
                  <input type="date" id="sale-input-fecha" class="form-control" required>
                </div>

                <div class="form-group">
                  <label for="sale-input-sneaker">Sneaker (Seleccionar) *</label>
                  <select id="sale-input-sneaker" class="form-control" required>
                    <!-- Opciones dinámicas -->
                  </select>
                </div>

                <div class="form-group">
                  <label for="sale-input-cantidad">Cantidad a Comprar *</label>
                  <input type="number" id="sale-input-cantidad" min="1" step="1" class="form-control" value="1" required>
                  <small id="sale-stock-hint" style="color: var(--text-muted); font-size: 0.75rem;">Stock disponible: --</small>
                </div>

                <div class="form-group">
                  <label for="sale-input-precio">Precio Unitario ($USD)</label>
                  <input type="number" id="sale-input-precio" step="0.01" min="0.01" class="form-control" placeholder="0.00" required>
                </div>

                <div class="form-group col-span-2" style="background: rgba(99, 102, 241, 0.08); padding: 16px; border-radius: var(--radius-md); border: 1px dashed rgba(99, 102, 241, 0.3);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-secondary);">Total a Cobrar:</span>
                    <span id="sale-display-total" style="font-size: 1.4rem; font-weight: 800; color: #fff;">$0.00</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-sale-modal">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btn-save-sale-modal">Confirmar Venta</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindEvents();
    this.refreshTable();
  },

  bindEvents() {
    const searchInput = document.getElementById('sales-search');
    const dateFilter = document.getElementById('sales-date-filter');
    const btnAdd = document.getElementById('btn-add-sale');
    const btnCloseModal = document.getElementById('btn-close-sale-modal');
    const btnCancelModal = document.getElementById('btn-cancel-sale-modal');
    const form = document.getElementById('sale-form');

    const sneakerSelect = document.getElementById('sale-input-sneaker');
    const cantidadInput = document.getElementById('sale-input-cantidad');
    const precioInput = document.getElementById('sale-input-precio');

    searchInput?.addEventListener('input', () => this.refreshTable());
    dateFilter?.addEventListener('change', () => this.refreshTable());

    btnAdd?.addEventListener('click', () => this.openModal());
    btnCloseModal?.addEventListener('click', () => this.closeModal());
    btnCancelModal?.addEventListener('click', () => this.closeModal());

    sneakerSelect?.addEventListener('change', () => this.handleSneakerSelectionChange());
    cantidadInput?.addEventListener('input', () => this.calculateTotalRealtime());
    precioInput?.addEventListener('input', () => this.calculateTotalRealtime());

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });
  },

  populateSneakerSelect(selectedId = null) {
    const select = document.getElementById('sale-input-sneaker');
    if (!select) return;

    const sneakers = sneakerService.listar();
    select.innerHTML = '<option value="">-- Elige un sneaker disponible --</option>' + sneakers.map(s => `
      <option value="${s.id}" data-precio="${s.precio}" data-stock="${s.stock}" ${String(s.id) === String(selectedId) ? 'selected' : ''}>
        ${s.marca} ${s.modelo} (US ${s.talla}) - Stock: ${s.stock} un. - $${s.precio.toFixed(2)}
      </option>
    `).join('');
  },

  handleSneakerSelectionChange() {
    const select = document.getElementById('sale-input-sneaker');
    const selectedOption = select.options[select.selectedIndex];
    const precioInput = document.getElementById('sale-input-precio');
    const stockHint = document.getElementById('sale-stock-hint');

    if (selectedOption && selectedOption.value) {
      const precio = selectedOption.getAttribute('data-precio');
      const stock = selectedOption.getAttribute('data-stock');
      precioInput.value = Number(precio).toFixed(2);
      stockHint.textContent = `Stock disponible: ${stock} pares`;
      stockHint.style.color = parseInt(stock, 10) <= 2 ? 'var(--danger)' : 'var(--text-muted)';
    } else {
      precioInput.value = '';
      stockHint.textContent = 'Stock disponible: --';
    }

    this.calculateTotalRealtime();
  },

  calculateTotalRealtime() {
    const cantidad = parseInt(document.getElementById('sale-input-cantidad')?.value, 10) || 0;
    const precio = parseFloat(document.getElementById('sale-input-precio')?.value) || 0;
    const totalEl = document.getElementById('sale-display-total');
    
    const total = cantidad * precio;
    if (totalEl) {
      totalEl.textContent = `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  },

  refreshTable() {
    const search = document.getElementById('sales-search')?.value || '';
    const fecha = document.getElementById('sales-date-filter')?.value || '';
    const tbody = document.getElementById('sales-table-body');
    if (!tbody) return;

    const sales = saleService.listar({ search, fecha });

    if (sales.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 36px;">
            No se han registrado ventas o pedidos que coincidan con los filtros.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = sales.map(s => `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.8rem; font-family: monospace;">#VNT-${s.id}</td>
        <td><span style="font-size: 0.85rem;">📅 ${s.fecha}</span></td>
        <td><strong>${s.cliente}</strong></td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${s.sneakerSummary || 'Sneaker #' + s.sneakerId}</div>
        </td>
        <td><span class="badge" style="background: rgba(255,255,255,0.06);">${s.cantidad} par(es)</span></td>
        <td>$${s.precioUnitario.toFixed(2)}</td>
        <td><strong style="color: var(--success); font-size: 1rem;">$${s.total.toFixed(2)}</strong></td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.salesModule.edit('${s.id}')" title="Modificar venta y recalcular">
              ✏️ Editar
            </button>
            <button class="btn btn-danger btn-sm" onclick="window.salesModule.delete('${s.id}')" title="Anular venta y reponer stock">
              🗑️ Anular
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openModal(sale = null) {
    const modal = document.getElementById('sale-modal');
    const modalTitle = document.getElementById('sale-modal-title');
    const errorAlert = document.getElementById('sale-form-error-alert');
    
    errorAlert.style.display = 'none';
    errorAlert.innerHTML = '';

    if (sale) {
      this.activeId = sale.id;
      modalTitle.textContent = `Modificar Venta (#VNT-${sale.id})`;
      this.populateSneakerSelect(sale.sneakerId);

      document.getElementById('sale-input-cliente').value = sale.cliente;
      document.getElementById('sale-input-fecha').value = sale.fecha;
      document.getElementById('sale-input-cantidad').value = sale.cantidad;
      document.getElementById('sale-input-precio').value = sale.precioUnitario;
      
      const sneaker = sneakerService.buscarPorId(sale.sneakerId);
      const stockHint = document.getElementById('sale-stock-hint');
      if (sneaker && stockHint) {
        stockHint.textContent = `Stock actual disponible: ${sneaker.stock} pares (+ ${sale.cantidad} de esta orden)`;
      }
    } else {
      this.activeId = null;
      modalTitle.textContent = 'Registrar Nueva Venta';
      this.populateSneakerSelect();
      document.getElementById('sale-form').reset();
      document.getElementById('sale-input-fecha').value = new Date().toISOString().split('T')[0];
      document.getElementById('sale-stock-hint').textContent = 'Stock disponible: --';
    }

    this.calculateTotalRealtime();
    modal.classList.add('open');
  },

  closeModal() {
    const modal = document.getElementById('sale-modal');
    modal.classList.remove('open');
    this.activeId = null;
  },

  handleFormSubmit() {
    const cliente = document.getElementById('sale-input-cliente').value;
    const fecha = document.getElementById('sale-input-fecha').value;
    const sneakerId = document.getElementById('sale-input-sneaker').value;
    const cantidad = parseInt(document.getElementById('sale-input-cantidad').value, 10);
    const precioUnitario = parseFloat(document.getElementById('sale-input-precio').value);

    const payload = {
      cliente,
      fecha,
      sneakerId,
      cantidad,
      precioUnitario
    };

    let result;
    if (this.activeId) {
      result = saleService.actualizar(this.activeId, payload);
    } else {
      result = saleService.crear(payload);
    }

    if (result.success) {
      this.closeModal();
      this.refreshTable();
    } else {
      const errorAlert = document.getElementById('sale-form-error-alert');
      errorAlert.innerHTML = `<strong>Error en la operación:</strong><br>&bull; ${result.errors.join('<br>&bull; ')}`;
      errorAlert.style.display = 'block';
    }
  },

  edit(id) {
    const sale = saleService.buscarPorId(id);
    if (sale) {
      this.openModal(sale);
    }
  },

  delete(id) {
    const sale = saleService.buscarPorId(id);
    if (sale && confirm(`¿Deseas anular la venta #VNT-${sale.id} de "${sale.cliente}"? Se repondrán ${sale.cantidad} pares al inventario.`)) {
      saleService.eliminar(id);
      this.refreshTable();
    }
  }
};

window.salesModule = SalesView;
