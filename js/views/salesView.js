import { saleService } from '../services/SaleService.js';
import { sneakerService } from '../services/SneakerService.js';
import { getLocalDateString } from '../models/Sale.js';

export const SalesView = {
  activeId: null,

  render(container) {
    container.innerHTML = `
      <div class="toolbar">
        <div class="search-filter-group" style="flex-wrap: wrap;">
          <input type="text" id="sales-search" class="input-search" placeholder="🔍 Buscar por cliente o sneaker...">
          <select id="sales-customer-filter" class="select-filter" style="max-width: 180px;">
            <option value="ALL">Todos los clientes</option>
          </select>
          <input type="date" id="sales-start-date-filter" class="select-filter" style="max-width: 150px;" title="Fecha Desde">
          <input type="date" id="sales-end-date-filter" class="select-filter" style="max-width: 150px;" title="Fecha Hasta">
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
              <!-- Renderizado dinámico seguro mediante DOM APIs -->
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
                  <label for="sale-input-cantidad">Cantidad a Comprar (Pares) *</label>
                  <input type="number" id="sale-input-cantidad" step="1" min="1" class="form-control" value="1" required>
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

    this.populateCustomerFilter();
    this.bindEvents();
    this.refreshTable();
  },

  populateCustomerFilter() {
    const select = document.getElementById('sales-customer-filter');
    if (!select) return;

    select.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = 'ALL';
    defaultOption.textContent = 'Todos los clientes';
    select.appendChild(defaultOption);

    const stats = saleService.getStats();
    stats.uniqueCustomers.forEach(c => {
      const option = document.createElement('option');
      option.value = c;
      option.textContent = c;
      select.appendChild(option);
    });
  },

  bindEvents() {
    const searchInput = document.getElementById('sales-search');
    const customerFilter = document.getElementById('sales-customer-filter');
    const startDateFilter = document.getElementById('sales-start-date-filter');
    const endDateFilter = document.getElementById('sales-end-date-filter');
    const btnAdd = document.getElementById('btn-add-sale');
    const btnCloseModal = document.getElementById('btn-close-sale-modal');
    const btnCancelModal = document.getElementById('btn-cancel-sale-modal');
    const form = document.getElementById('sale-form');

    const sneakerSelect = document.getElementById('sale-input-sneaker');
    const cantidadInput = document.getElementById('sale-input-cantidad');
    const precioInput = document.getElementById('sale-input-precio');

    searchInput?.addEventListener('input', () => this.refreshTable());
    customerFilter?.addEventListener('change', () => this.refreshTable());
    startDateFilter?.addEventListener('change', () => this.refreshTable());
    endDateFilter?.addEventListener('change', () => this.refreshTable());

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

    select.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Elige un sneaker disponible --';
    select.appendChild(defaultOption);

    const sneakers = sneakerService.getAll();
    sneakers.forEach(s => {
      const option = document.createElement('option');
      option.value = s.id;
      option.setAttribute('data-precio', s.price);
      option.setAttribute('data-stock', s.stock);
      option.textContent = `${s.brand} ${s.model} (US ${s.size}) - Stock: ${s.stock} un. - $${s.price.toFixed(2)}`;
      if (String(s.id) === String(selectedId)) {
        option.selected = true;
      }
      select.appendChild(option);
    });
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
    const rawVal = document.getElementById('sale-input-cantidad')?.value;
    const cantidad = rawVal !== '' && rawVal !== undefined ? Number(rawVal) : 0;
    const precio = parseFloat(document.getElementById('sale-input-precio')?.value) || 0;
    const totalEl = document.getElementById('sale-display-total');
    
    if (isNaN(cantidad) || cantidad <= 0 || !Number.isInteger(cantidad)) {
      if (totalEl) totalEl.textContent = '$0.00';
      return;
    }

    const total = cantidad * precio;
    if (totalEl) {
      totalEl.textContent = `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  },

  refreshTable() {
    const search = document.getElementById('sales-search')?.value || '';
    const customer = document.getElementById('sales-customer-filter')?.value || '';
    const startDate = document.getElementById('sales-start-date-filter')?.value || '';
    const endDate = document.getElementById('sales-end-date-filter')?.value || '';
    const tbody = document.getElementById('sales-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    const sales = saleService.getAll({ search, customer, startDate, endDate });

    if (sales.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = 8;
      emptyCell.style.textAlign = 'center';
      emptyCell.style.color = 'var(--text-muted)';
      emptyCell.style.padding = '36px';
      emptyCell.textContent = 'No se han registrado ventas o pedidos que coincidan con los filtros.';
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return;
    }

    sales.forEach(s => {
      const tr = document.createElement('tr');

      // 1. ID de Venta
      const tdId = document.createElement('td');
      tdId.style.color = 'var(--text-muted)';
      tdId.style.fontSize = '0.8rem';
      tdId.style.fontFamily = 'monospace';
      tdId.textContent = `#VNT-${s.id}`;
      tr.appendChild(tdId);

      // 2. Fecha
      const tdFecha = document.createElement('td');
      const spanFecha = document.createElement('span');
      spanFecha.style.fontSize = '0.85rem';
      spanFecha.textContent = `📅 ${s.fecha}`;
      tdFecha.appendChild(spanFecha);
      tr.appendChild(tdFecha);

      // 3. Cliente
      const tdCliente = document.createElement('td');
      const strongCliente = document.createElement('strong');
      strongCliente.textContent = s.cliente;
      tdCliente.appendChild(strongCliente);
      tr.appendChild(tdCliente);

      // 4. Sneaker Vendido
      const tdSneaker = document.createElement('td');
      const divSneaker = document.createElement('div');
      divSneaker.style.fontWeight = '600';
      divSneaker.style.color = 'var(--text-primary)';
      divSneaker.textContent = s.sneakerSummary || `Sneaker #${s.sneakerId}`;
      tdSneaker.appendChild(divSneaker);
      tr.appendChild(tdSneaker);

      // 5. Cantidad
      const tdCant = document.createElement('td');
      const badgeCant = document.createElement('span');
      badgeCant.className = 'badge';
      badgeCant.style.background = 'rgba(255,255,255,0.06)';
      badgeCant.textContent = `${s.cantidad} par(es)`;
      tdCant.appendChild(badgeCant);
      tr.appendChild(tdCant);

      // 6. Precio Unitario
      const tdPrecio = document.createElement('td');
      tdPrecio.textContent = `$${s.precioUnitario.toFixed(2)}`;
      tr.appendChild(tdPrecio);

      // 7. Total
      const tdTotal = document.createElement('td');
      const strongTotal = document.createElement('strong');
      strongTotal.style.color = 'var(--success)';
      strongTotal.style.fontSize = '1rem';
      strongTotal.textContent = `$${s.total.toFixed(2)}`;
      tdTotal.appendChild(strongTotal);
      tr.appendChild(tdTotal);

      // 8. Acciones
      const tdActions = document.createElement('td');
      tdActions.style.textAlign = 'right';

      const actionsContainer = document.createElement('div');
      actionsContainer.style.display = 'inline-flex';
      actionsContainer.style.gap = '8px';

      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn btn-secondary btn-sm';
      btnEdit.textContent = '✏️ Editar';
      btnEdit.title = 'Modificar venta y recalcular';
      btnEdit.addEventListener('click', () => this.edit(s.id));

      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn btn-danger btn-sm';
      btnDelete.textContent = '🗑️ Anular';
      btnDelete.title = 'Anular venta y reponer stock';
      btnDelete.addEventListener('click', () => this.delete(s.id));

      actionsContainer.appendChild(btnEdit);
      actionsContainer.appendChild(btnDelete);
      tdActions.appendChild(actionsContainer);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });
  },

  openModal(sale = null) {
    const modal = document.getElementById('sale-modal');
    const modalTitle = document.getElementById('sale-modal-title');
    const errorAlert = document.getElementById('sale-form-error-alert');
    
    errorAlert.style.display = 'none';
    errorAlert.textContent = '';

    if (sale) {
      this.activeId = sale.id;
      modalTitle.textContent = `Modificar Venta (#VNT-${sale.id})`;
      this.populateSneakerSelect(sale.sneakerId);

      document.getElementById('sale-input-cliente').value = sale.cliente;
      document.getElementById('sale-input-fecha').value = sale.fecha;
      document.getElementById('sale-input-cantidad').value = sale.cantidad;
      document.getElementById('sale-input-precio').value = sale.precioUnitario;
      
      const sneaker = sneakerService.getById(sale.sneakerId);
      const stockHint = document.getElementById('sale-stock-hint');
      if (sneaker && stockHint) {
        stockHint.textContent = `Stock actual disponible: ${sneaker.stock} pares (+ ${sale.cantidad} de esta orden)`;
      }
    } else {
      this.activeId = null;
      modalTitle.textContent = 'Registrar Nueva Venta';
      this.populateSneakerSelect();
      document.getElementById('sale-form').reset();
      document.getElementById('sale-input-fecha').value = getLocalDateString();
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
    const rawCantidad = document.getElementById('sale-input-cantidad').value;
    const rawPrecio = document.getElementById('sale-input-precio').value;

    const cantidad = rawCantidad !== '' ? Number(rawCantidad) : NaN;
    const precioUnitario = rawPrecio !== '' ? Number(rawPrecio) : NaN;

    const payload = {
      cliente,
      fecha,
      sneakerId,
      cantidad,
      precioUnitario
    };

    let result;
    if (this.activeId) {
      result = saleService.update(this.activeId, payload);
    } else {
      result = saleService.create(payload);
    }

    if (result.success) {
      this.closeModal();
      this.populateCustomerFilter();
      this.refreshTable();
    } else {
      const errorAlert = document.getElementById('sale-form-error-alert');
      errorAlert.textContent = '';
      const strong = document.createElement('strong');
      strong.textContent = 'Error en la operación:';
      errorAlert.appendChild(strong);
      errorAlert.appendChild(document.createElement('br'));
      
      result.errors.forEach(err => {
        const line = document.createElement('div');
        line.textContent = `• ${err}`;
        errorAlert.appendChild(line);
      });
      errorAlert.style.display = 'block';
    }
  },

  edit(id) {
    const sale = saleService.getById(id);
    if (sale) {
      this.openModal(sale);
    }
  },

  delete(id) {
    const sale = saleService.getById(id);
    if (sale && confirm(`¿Deseas anular la venta #VNT-${sale.id} de "${sale.cliente}"? Se repondrán ${sale.cantidad} pares al inventario.`)) {
      const result = saleService.delete(id);
      if (result && result.success === false) {
        alert(result.errors.join('\n'));
      } else {
        this.populateCustomerFilter();
        this.refreshTable();
      }
    }
  }
};

window.salesModule = SalesView;
