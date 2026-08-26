import { sneakerService } from '../services/SneakerService.js';
import { saleService } from '../services/SaleService.js';

export const StatsView = {
  // Filtros activos para el dashboard
  activeFilters: {
    brand: 'ALL',
    minPrice: '',
    maxPrice: '',
    customer: 'ALL',
    startDate: '',
    endDate: ''
  },

  render(container) {
    container.innerHTML = `
      <!-- Toolbar de Filtros Avanzados -->
      <div class="glass-panel" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <h3 style="font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
            <span>⚡</span> Filtros Avanzados de Métricas y Reportes
          </h3>
          <div style="display: flex; gap: 10px;">
            <button id="btn-export-json" class="btn btn-secondary btn-sm" title="Descargar reporte completo en formato JSON">
              📥 Exportar JSON
            </button>
            <button id="btn-export-csv" class="btn btn-primary btn-sm" title="Descargar reporte consolidado en formato CSV">
              📊 Exportar CSV
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
          <div class="form-group">
            <label style="font-size: 0.78rem;">Marca de Sneaker</label>
            <select id="filter-dash-brand" class="select-filter" style="width: 100%;">
              <option value="ALL">Todas las marcas</option>
              <option value="Nike">Nike</option>
              <option value="Adidas">Adidas</option>
              <option value="New Balance">New Balance</option>
              <option value="Jordan">Jordan</option>
              <option value="Puma">Puma</option>
            </select>
          </div>

          <div class="form-group">
            <label style="font-size: 0.78rem;">Precio Mínimo ($)</label>
            <input type="number" id="filter-dash-min-price" class="input-search" placeholder="Min $" min="0" step="10">
          </div>

          <div class="form-group">
            <label style="font-size: 0.78rem;">Precio Máximo ($)</label>
            <input type="number" id="filter-dash-max-price" class="input-search" placeholder="Max $" min="0" step="10">
          </div>

          <div class="form-group">
            <label style="font-size: 0.78rem;">Cliente</label>
            <select id="filter-dash-customer" class="select-filter" style="width: 100%;">
              <option value="ALL">Todos los clientes</option>
              <!-- Opciones dinámicas de clientes -->
            </select>
          </div>

          <div class="form-group">
            <label style="font-size: 0.78rem;">Fecha Desde</label>
            <input type="date" id="filter-dash-start-date" class="input-search">
          </div>

          <div class="form-group">
            <label style="font-size: 0.78rem;">Fecha Hasta</label>
            <input type="date" id="filter-dash-end-date" class="input-search">
          </div>
        </div>

        <div style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 8px;">
          <button id="btn-reset-filters" class="btn btn-secondary btn-sm">Limpiar Filtros</button>
          <button id="btn-apply-filters" class="btn btn-primary btn-sm">Aplicar Filtros</button>
        </div>
      </div>

      <!-- Tarjetas de Métricas Clave (KPIs) -->
      <div id="kpi-metrics-container">
        <!-- Renderizado dinámico de KPIs -->
      </div>

      <!-- Alertas de Stock Bajo y Tablas Consolidadas -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; margin-top: 24px;">
        <!-- Panel Alerta Stock Bajo -->
        <div class="glass-panel" style="border-left: 4px solid var(--danger);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.05rem; display: flex; align-items: center; gap: 8px; color: #FCA5A5;">
              <span>🚨</span> Alertas de Stock Bajo (&lt; 3 unidades)
            </h3>
            <span id="low-stock-badge-count" class="badge badge-stock-low">0 modelos</span>
          </div>
          <div id="low-stock-list-container" style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Renderizado dinámico de stock crítico -->
          </div>
        </div>

        <!-- Panel de Top Productos Más Vendidos -->
        <div class="glass-panel" style="border-left: 4px solid var(--accent-primary);">
          <h3 style="font-size: 1.05rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <span>🏆</span> Productos Más Vendidos
          </h3>
          <div id="top-selling-list-container" style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Renderizado dinámico de más vendidos -->
          </div>
        </div>
      </div>

      <!-- Distribución de Inventario Filtrado -->
      <div class="glass-panel" style="margin-top: 24px;">
        <h3 style="margin-bottom: 16px; font-size: 1.05rem;">📊 Distribución de Stock por Marca</h3>
        <div id="brand-distribution-container" style="display: flex; flex-direction: column; gap: 12px;">
          <!-- Barras de progreso por marca -->
        </div>
      </div>
    `;

    this.populateCustomerFilter();
    this.bindEvents();
    this.refreshDashboard();
  },

  populateCustomerFilter() {
    const customerSelect = document.getElementById('filter-dash-customer');
    if (!customerSelect) return;

    const salesStats = saleService.getStats();
    customerSelect.innerHTML = '<option value="ALL">Todos los clientes</option>' +
      salesStats.uniqueCustomers.map(c => `
        <option value="${c}" ${this.activeFilters.customer === c ? 'selected' : ''}>${c}</option>
      `).join('');
  },

  bindEvents() {
    const btnApply = document.getElementById('btn-apply-filters');
    const btnReset = document.getElementById('btn-reset-filters');
    const btnExportJson = document.getElementById('btn-export-json');
    const btnExportCsv = document.getElementById('btn-export-csv');

    btnApply?.addEventListener('click', () => {
      this.activeFilters.brand = document.getElementById('filter-dash-brand').value;
      this.activeFilters.minPrice = document.getElementById('filter-dash-min-price').value;
      this.activeFilters.maxPrice = document.getElementById('filter-dash-max-price').value;
      this.activeFilters.customer = document.getElementById('filter-dash-customer').value;
      this.activeFilters.startDate = document.getElementById('filter-dash-start-date').value;
      this.activeFilters.endDate = document.getElementById('filter-dash-end-date').value;
      this.refreshDashboard();
    });

    btnReset?.addEventListener('click', () => {
      this.activeFilters = {
        brand: 'ALL',
        minPrice: '',
        maxPrice: '',
        customer: 'ALL',
        startDate: '',
        endDate: ''
      };
      document.getElementById('filter-dash-brand').value = 'ALL';
      document.getElementById('filter-dash-min-price').value = '';
      document.getElementById('filter-dash-max-price').value = '';
      document.getElementById('filter-dash-customer').value = 'ALL';
      document.getElementById('filter-dash-start-date').value = '';
      document.getElementById('filter-dash-end-date').value = '';
      this.refreshDashboard();
    });

    btnExportJson?.addEventListener('click', () => this.exportToJson());
    btnExportCsv?.addEventListener('click', () => this.exportToCsv());
  },

  refreshDashboard() {
    // 1. Obtener datos filtrados de ambos servicios en memoria
    const filteredSneakers = sneakerService.getAll({
      brand: this.activeFilters.brand,
      minPrice: this.activeFilters.minPrice,
      maxPrice: this.activeFilters.maxPrice
    });

    const filteredSales = saleService.getAll({
      customer: this.activeFilters.customer,
      startDate: this.activeFilters.startDate,
      endDate: this.activeFilters.endDate
    });

    // 2. Calcular KPIs sobre los conjuntos de datos
    const totalInventoryValue = filteredSneakers.reduce((sum, s) => sum + (s.price * s.stock), 0);
    const totalPairsInStock = filteredSneakers.reduce((sum, s) => sum + s.stock, 0);
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const totalTransactions = filteredSales.length;
    const totalPairsSold = filteredSales.reduce((sum, s) => sum + s.cantidad, 0);

    // Calcular producto más vendido en el conjunto filtrado
    const salesMap = {};
    filteredSales.forEach(s => {
      if (!salesMap[s.sneakerId]) {
        salesMap[s.sneakerId] = {
          sneakerId: s.sneakerId,
          summary: s.sneakerSummary,
          unitsSold: 0,
          revenue: 0
        };
      }
      salesMap[s.sneakerId].unitsSold += s.cantidad;
      salesMap[s.sneakerId].revenue += s.total;
    });

    const topSellingList = Object.values(salesMap).sort((a, b) => b.unitsSold - a.unitsSold);
    const bestSeller = topSellingList.length > 0 ? topSellingList[0] : null;

    // Alertas de stock bajo (< 3 unidades)
    const lowStockSneakers = filteredSneakers.filter(s => s.stock < 3);

    // 3. Renderizar KPIs
    const kpiContainer = document.getElementById('kpi-metrics-container');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">💵</div>
            <div class="stat-info">
              <div class="stat-label">Ingresos Acumulados</div>
              <div class="stat-value" style="color: var(--success);">$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <small style="color: var(--text-muted); font-size: 0.75rem;">${totalTransactions} ventas (${totalPairsSold} pares)</small>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-info">
              <div class="stat-label">Producto Más Vendido</div>
              <div class="stat-value" style="font-size: 1.1rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;" title="${bestSeller ? bestSeller.summary : 'Sin ventas'}">
                ${bestSeller ? bestSeller.summary.split('(')[0] : 'N/A'}
              </div>
              <small style="color: var(--accent-primary); font-size: 0.75rem; font-weight: 600;">
                ${bestSeller ? `${bestSeller.unitsSold} pares vendidos ($${bestSeller.revenue.toFixed(2)})` : 'Sin datos'}
              </small>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
              <div class="stat-label">Valor de Stock Actual</div>
              <div class="stat-value">$${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <small style="color: var(--text-muted); font-size: 0.75rem;">${totalPairsInStock} pares (${filteredSneakers.length} modelos)</small>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
              <div class="stat-label">Alertas de Stock Bajo (&lt; 3)</div>
              <div class="stat-value" style="color: ${lowStockSneakers.length > 0 ? 'var(--danger)' : 'var(--text-primary)'};">
                ${lowStockSneakers.length}
              </div>
              <small style="color: var(--text-muted); font-size: 0.75rem;">Requieren reposición inmediata</small>
            </div>
          </div>
        </div>
      `;
    }

    // 4. Renderizar Lista de Stock Bajo
    const lowStockContainer = document.getElementById('low-stock-list-container');
    const badgeCount = document.getElementById('low-stock-badge-count');
    if (badgeCount) badgeCount.textContent = `${lowStockSneakers.length} modelo(s)`;

    if (lowStockContainer) {
      lowStockContainer.innerHTML = '';
      if (lowStockSneakers.length === 0) {
        lowStockContainer.innerHTML = `
          <div style="color: var(--success); font-size: 0.85rem; padding: 12px 0;">
            ✓ Todo el stock filtrado está en niveles óptimos (&ge; 3 unidades).
          </div>
        `;
      } else {
        lowStockSneakers.forEach(s => {
          const item = document.createElement('div');
          item.style.display = 'flex';
          item.style.justifyContent = 'space-between';
          item.style.alignItems = 'center';
          item.style.padding = '10px 14px';
          item.style.background = 'rgba(239, 68, 68, 0.08)';
          item.style.border = '1px solid rgba(239, 68, 68, 0.2)';
          item.style.borderRadius = 'var(--radius-sm)';

          const info = document.createElement('div');
          const title = document.createElement('div');
          title.style.fontWeight = '600';
          title.style.fontSize = '0.9rem';
          title.textContent = `${s.brand} - ${s.model}`;

          const sub = document.createElement('div');
          sub.style.fontSize = '0.75rem';
          sub.style.color = 'var(--text-muted)';
          sub.textContent = `Talla US ${s.size} • SKU: ${s.sku} • $${s.price.toFixed(2)}`;

          info.appendChild(title);
          info.appendChild(sub);

          const stockBadge = document.createElement('span');
          stockBadge.className = 'badge badge-stock-low';
          stockBadge.textContent = `${s.stock} ${s.stock === 1 ? 'par' : 'pares'}`;

          item.appendChild(info);
          item.appendChild(stockBadge);
          lowStockContainer.appendChild(item);
        });
      }
    }

    // 5. Renderizar Top Productos Más Vendidos
    const topContainer = document.getElementById('top-selling-list-container');
    if (topContainer) {
      topContainer.innerHTML = '';
      if (topSellingList.length === 0) {
        topContainer.innerHTML = `
          <div style="color: var(--text-muted); font-size: 0.85rem; padding: 12px 0;">
            No hay transacciones registradas con los filtros seleccionados.
          </div>
        `;
      } else {
        topSellingList.slice(0, 4).forEach((item, idx) => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.justifyContent = 'space-between';
          row.style.alignItems = 'center';
          row.style.padding = '10px 14px';
          row.style.background = 'rgba(255, 255, 255, 0.02)';
          row.style.border = '1px solid var(--border-color)';
          row.style.borderRadius = 'var(--radius-sm)';

          const info = document.createElement('div');
          const title = document.createElement('div');
          title.style.fontWeight = '600';
          title.style.fontSize = '0.9rem';
          title.textContent = `${idx + 1}. ${item.summary}`;

          const sub = document.createElement('div');
          sub.style.fontSize = '0.75rem';
          sub.style.color = 'var(--text-muted)';
          sub.textContent = `Total Facturado: $${item.revenue.toFixed(2)}`;

          info.appendChild(title);
          info.appendChild(sub);

          const countBadge = document.createElement('span');
          countBadge.className = 'badge badge-brand';
          countBadge.textContent = `${item.unitsSold} pares`;

          row.appendChild(info);
          row.appendChild(countBadge);
          topContainer.appendChild(row);
        });
      }
    }

    // 6. Distribución de Stock por Marca
    const brandDistContainer = document.getElementById('brand-distribution-container');
    if (brandDistContainer) {
      const brandCounts = filteredSneakers.reduce((acc, s) => {
        acc[s.brand] = (acc[s.brand] || 0) + s.stock;
        return acc;
      }, {});

      brandDistContainer.innerHTML = '';
      if (Object.keys(brandCounts).length === 0) {
        brandDistContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">No hay calzado disponible en los filtros activos.</div>`;
      } else {
        Object.entries(brandCounts).forEach(([brand, count]) => {
          const percentage = totalPairsInStock > 0 ? Math.round((count / totalPairsInStock) * 100) : 0;
          const barDiv = document.createElement('div');
          barDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
              <span><strong>${brand}</strong> (${count} pares)</span>
              <span style="color: var(--text-secondary);">${percentage}%</span>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
              <div style="width: ${percentage}%; height: 100%; background: var(--accent-gradient);"></div>
            </div>
          `;
          brandDistContainer.appendChild(barDiv);
        });
      }
    }
  },

  /**
   * Exporta el reporte consolidado en formato JSON en memoria y dispara su descarga
   */
  exportToJson() {
    const reportData = {
      generatedAt: new Date().toISOString(),
      filtersApplied: this.activeFilters,
      inventorySummary: sneakerService.getStats(),
      salesSummary: saleService.getStats(),
      sneakers: sneakerService.getAll({
        brand: this.activeFilters.brand,
        minPrice: this.activeFilters.minPrice,
        maxPrice: this.activeFilters.maxPrice
      }),
      sales: saleService.getAll({
        customer: this.activeFilters.customer,
        startDate: this.activeFilters.startDate,
        endDate: this.activeFilters.endDate
      })
    };

    const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `reporte_kicksvault_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  /**
   * Exporta el reporte consolidado en formato CSV en memoria
   */
  exportToCsv() {
    const sales = saleService.getAll({
      customer: this.activeFilters.customer,
      startDate: this.activeFilters.startDate,
      endDate: this.activeFilters.endDate
    });

    const headers = ['ID Venta', 'Fecha', 'Cliente', 'Sneaker Vendido', 'Cantidad', 'Precio Unitario', 'Total'];
    const rows = sales.map(s => [
      `"${s.id}"`,
      `"${s.fecha}"`,
      `"${s.cliente.replace(/"/g, '""')}"`,
      `"${s.sneakerSummary.replace(/"/g, '""')}"`,
      s.cantidad,
      s.precioUnitario.toFixed(2),
      s.total.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodedUri);
    downloadAnchor.setAttribute('download', `reporte_ventas_kicksvault_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
};
