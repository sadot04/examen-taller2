import { sneakerService } from '../services/SneakerService.js';
import { saleService } from '../services/SaleService.js';

/**
 * Sanitiza un valor de celda para prevenir inyección de fórmulas CSV (CSV Formula Injection)
 * Prefija con apóstrofe si comienza con =, +, -, @, \t, \r
 * y escapa comillas dobles.
 * @param {any} val
 * @returns {string}
 */
function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  
  // Si el valor comienza con caracteres ejecutables como fórmula, anteponer comilla simple '
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escapar comillas dobles internas
  return `"${str.replace(/"/g, '""')}"`;
}

export const StatsView = {
  // Filtros activos persistentes para el dashboard
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
              <!-- Opciones dinámicas de clientes seguras -->
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
        <!-- Renderizado dinámico de KPIs mediante DOM APIs -->
      </div>

      <!-- Alertas de Stock Bajo y Tablas Consolidadas -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 24px; margin-top: 24px;">
        <!-- Panel Alerta Stock Bajo -->
        <div class="glass-panel" style="border-left: 4px solid var(--danger);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.05rem; display: flex; align-items: center; gap: 8px; color: #FCA5A5;">
              <span>🚨</span> Alertas de Stock Bajo (&le; 3 unidades)
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

    this.syncFilterControls();
    this.populateCustomerFilter();
    this.bindEvents();
    this.refreshDashboard();
  },

  /**
   * Sincroniza los controles del DOM con el estado persistente de activeFilters
   */
  syncFilterControls() {
    const brandEl = document.getElementById('filter-dash-brand');
    const minPriceEl = document.getElementById('filter-dash-min-price');
    const maxPriceEl = document.getElementById('filter-dash-max-price');
    const startDateEl = document.getElementById('filter-dash-start-date');
    const endDateEl = document.getElementById('filter-dash-end-date');

    if (brandEl) brandEl.value = this.activeFilters.brand || 'ALL';
    if (minPriceEl) minPriceEl.value = this.activeFilters.minPrice !== undefined ? this.activeFilters.minPrice : '';
    if (maxPriceEl) maxPriceEl.value = this.activeFilters.maxPrice !== undefined ? this.activeFilters.maxPrice : '';
    if (startDateEl) startDateEl.value = this.activeFilters.startDate || '';
    if (endDateEl) endDateEl.value = this.activeFilters.endDate || '';
  },

  populateCustomerFilter() {
    const customerSelect = document.getElementById('filter-dash-customer');
    if (!customerSelect) return;

    customerSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = 'ALL';
    defaultOption.textContent = 'Todos los clientes';
    if (!this.activeFilters.customer || this.activeFilters.customer === 'ALL') {
      defaultOption.selected = true;
    }
    customerSelect.appendChild(defaultOption);

    const salesStats = saleService.getStats();
    salesStats.uniqueCustomers.forEach(c => {
      const option = document.createElement('option');
      option.value = c;
      option.textContent = c;
      if (this.activeFilters.customer === c) {
        option.selected = true;
      }
      customerSelect.appendChild(option);
    });
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
      this.syncFilterControls();
      const customerSelect = document.getElementById('filter-dash-customer');
      if (customerSelect) customerSelect.value = 'ALL';
      this.refreshDashboard();
    });

    btnExportJson?.addEventListener('click', () => this.exportToJson());
    btnExportCsv?.addEventListener('click', () => this.exportToCsv());
  },

  /**
   * Obtiene los conjuntos de datos sincronizados con todos los filtros activos
   */
  getFilteredData() {
    // 1. Obtener sneakers filtrados por criterios de producto (marca, minPrice, maxPrice)
    const filteredSneakers = sneakerService.getAll({
      brand: this.activeFilters.brand,
      minPrice: this.activeFilters.minPrice,
      maxPrice: this.activeFilters.maxPrice
    });

    // 2. Extraer el conjunto de IDs de sneakers que cumplen con el filtro de producto
    const allowedSneakerIds = new Set(filteredSneakers.map(s => String(s.id)));

    // 3. Obtener ventas filtradas restringidas a los sneakers filtrados + filtros de venta (cliente, fechas)
    const filteredSales = saleService.getAll({
      customer: this.activeFilters.customer,
      startDate: this.activeFilters.startDate,
      endDate: this.activeFilters.endDate,
      sneakerIds: allowedSneakerIds
    });

    return {
      filteredSneakers,
      allowedSneakerIds,
      filteredSales
    };
  },

  refreshDashboard() {
    const { filteredSneakers, filteredSales } = this.getFilteredData();

    // Calcular KPIs sobre los conjuntos de datos consistentes
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

    // Alertas de stock crítico: 3 unidades o menos (<= 3)
    const lowStockSneakers = filteredSneakers.filter(s => s.stock <= 3);

    // Renderizar KPIs usando DOM APIs puras
    const kpiContainer = document.getElementById('kpi-metrics-container');
    if (kpiContainer) {
      kpiContainer.innerHTML = '';
      const grid = document.createElement('div');
      grid.className = 'stats-grid';

      // KPI 1: Ingresos Acumulados
      const card1 = document.createElement('div');
      card1.className = 'stat-card';
      const icon1 = document.createElement('div');
      icon1.className = 'stat-icon';
      icon1.textContent = '💵';
      const info1 = document.createElement('div');
      info1.className = 'stat-info';
      const label1 = document.createElement('div');
      label1.className = 'stat-label';
      label1.textContent = 'Ingresos Acumulados';
      const val1 = document.createElement('div');
      val1.className = 'stat-value';
      val1.style.color = 'var(--success)';
      val1.textContent = `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const small1 = document.createElement('small');
      small1.style.color = 'var(--text-muted)';
      small1.style.fontSize = '0.75rem';
      small1.textContent = `${totalTransactions} ventas (${totalPairsSold} pares)`;
      info1.appendChild(label1);
      info1.appendChild(val1);
      info1.appendChild(small1);
      card1.appendChild(icon1);
      card1.appendChild(info1);
      grid.appendChild(card1);

      // KPI 2: Producto Más Vendido
      const card2 = document.createElement('div');
      card2.className = 'stat-card';
      const icon2 = document.createElement('div');
      icon2.className = 'stat-icon';
      icon2.textContent = '🔥';
      const info2 = document.createElement('div');
      info2.className = 'stat-info';
      const label2 = document.createElement('div');
      label2.className = 'stat-label';
      label2.textContent = 'Producto Más Vendido';
      const val2 = document.createElement('div');
      val2.className = 'stat-value';
      val2.style.fontSize = '1.1rem';
      val2.style.fontWeight = '700';
      val2.style.whiteSpace = 'nowrap';
      val2.style.overflow = 'hidden';
      val2.style.textOverflow = 'ellipsis';
      val2.style.maxWidth = '220px';
      val2.title = bestSeller ? bestSeller.summary : 'Sin ventas';
      val2.textContent = bestSeller ? bestSeller.summary.split('(')[0].trim() : 'N/A';

      const small2 = document.createElement('small');
      small2.style.color = 'var(--accent-primary)';
      small2.style.fontSize = '0.75rem';
      small2.style.fontWeight = '600';
      small2.textContent = bestSeller ? `${bestSeller.unitsSold} pares vendidos ($${bestSeller.revenue.toFixed(2)})` : 'Sin datos';
      info2.appendChild(label2);
      info2.appendChild(val2);
      info2.appendChild(small2);
      card2.appendChild(icon2);
      card2.appendChild(info2);
      grid.appendChild(card2);

      // KPI 3: Valor de Stock
      const card3 = document.createElement('div');
      card3.className = 'stat-card';
      const icon3 = document.createElement('div');
      icon3.className = 'stat-icon';
      icon3.textContent = '📦';
      const info3 = document.createElement('div');
      info3.className = 'stat-info';
      const label3 = document.createElement('div');
      label3.className = 'stat-label';
      label3.textContent = 'Valor de Stock Actual';
      const val3 = document.createElement('div');
      val3.className = 'stat-value';
      val3.textContent = `$${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const small3 = document.createElement('small');
      small3.style.color = 'var(--text-muted)';
      small3.style.fontSize = '0.75rem';
      small3.textContent = `${totalPairsInStock} pares (${filteredSneakers.length} modelos)`;
      info3.appendChild(label3);
      info3.appendChild(val3);
      info3.appendChild(small3);
      card3.appendChild(icon3);
      card3.appendChild(info3);
      grid.appendChild(card3);

      // KPI 4: Alertas de Stock Bajo (<= 3)
      const card4 = document.createElement('div');
      card4.className = 'stat-card';
      const icon4 = document.createElement('div');
      icon4.className = 'stat-icon';
      icon4.textContent = '⚠️';
      const info4 = document.createElement('div');
      info4.className = 'stat-info';
      const label4 = document.createElement('div');
      label4.className = 'stat-label';
      label4.textContent = 'Stock Crítico (≤ 3)';
      const val4 = document.createElement('div');
      val4.className = 'stat-value';
      val4.style.color = lowStockSneakers.length > 0 ? 'var(--danger)' : 'var(--text-primary)';
      val4.textContent = String(lowStockSneakers.length);
      const small4 = document.createElement('small');
      small4.style.color = 'var(--text-muted)';
      small4.style.fontSize = '0.75rem';
      small4.textContent = 'Requieren reposición inmediata';
      info4.appendChild(label4);
      info4.appendChild(val4);
      info4.appendChild(small4);
      card4.appendChild(icon4);
      card4.appendChild(info4);
      grid.appendChild(card4);

      kpiContainer.appendChild(grid);
    }

    // Renderizar Lista de Stock Bajo
    const lowStockContainer = document.getElementById('low-stock-list-container');
    const badgeCount = document.getElementById('low-stock-badge-count');
    if (badgeCount) badgeCount.textContent = `${lowStockSneakers.length} modelo(s)`;

    if (lowStockContainer) {
      lowStockContainer.innerHTML = '';
      if (lowStockSneakers.length === 0) {
        const okDiv = document.createElement('div');
        okDiv.style.color = 'var(--success)';
        okDiv.style.fontSize = '0.85rem';
        okDiv.style.padding = '12px 0';
        okDiv.textContent = '✓ Todo el stock filtrado está en niveles óptimos (> 3 unidades).';
        lowStockContainer.appendChild(okDiv);
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

    // Renderizar Top Productos Más Vendidos
    const topContainer = document.getElementById('top-selling-list-container');
    if (topContainer) {
      topContainer.innerHTML = '';
      if (topSellingList.length === 0) {
        const noData = document.createElement('div');
        noData.style.color = 'var(--text-muted)';
        noData.style.fontSize = '0.85rem';
        noData.style.padding = '12px 0';
        noData.textContent = 'No hay transacciones registradas con los filtros seleccionados.';
        topContainer.appendChild(noData);
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

    // Distribución de Stock por Marca
    const brandDistContainer = document.getElementById('brand-distribution-container');
    if (brandDistContainer) {
      const brandCounts = filteredSneakers.reduce((acc, s) => {
        acc[s.brand] = (acc[s.brand] || 0) + s.stock;
        return acc;
      }, {});

      brandDistContainer.innerHTML = '';
      if (Object.keys(brandCounts).length === 0) {
        const emptyBrand = document.createElement('div');
        emptyBrand.style.color = 'var(--text-muted)';
        emptyBrand.style.fontSize = '0.85rem';
        emptyBrand.textContent = 'No hay calzado disponible en los filtros activos.';
        brandDistContainer.appendChild(emptyBrand);
      } else {
        Object.entries(brandCounts).forEach(([brand, count]) => {
          const percentage = totalPairsInStock > 0 ? Math.round((count / totalPairsInStock) * 100) : 0;
          const barDiv = document.createElement('div');

          const headerDiv = document.createElement('div');
          headerDiv.style.display = 'flex';
          headerDiv.style.justifyContent = 'space-between';
          headerDiv.style.fontSize = '0.85rem';
          headerDiv.style.marginBottom = '6px';

          const brandSpan = document.createElement('span');
          const strongBrand = document.createElement('strong');
          strongBrand.textContent = brand;
          brandSpan.appendChild(strongBrand);
          brandSpan.appendChild(document.createTextNode(` (${count} pares)`));

          const percentSpan = document.createElement('span');
          percentSpan.style.color = 'var(--text-secondary)';
          percentSpan.textContent = `${percentage}%`;

          headerDiv.appendChild(brandSpan);
          headerDiv.appendChild(percentSpan);

          const trackDiv = document.createElement('div');
          trackDiv.style.width = '100%';
          trackDiv.style.height = '8px';
          trackDiv.style.background = 'rgba(255,255,255,0.06)';
          trackDiv.style.borderRadius = '4px';
          trackDiv.style.overflow = 'hidden';

          const fillDiv = document.createElement('div');
          fillDiv.style.width = `${percentage}%`;
          fillDiv.style.height = '100%';
          fillDiv.style.background = 'var(--accent-gradient)';

          trackDiv.appendChild(fillDiv);
          barDiv.appendChild(headerDiv);
          barDiv.appendChild(trackDiv);

          brandDistContainer.appendChild(barDiv);
        });
      }
    }
  },

  /**
   * Exporta el reporte consolidado en formato JSON en memoria y dispara su descarga
   */
  exportToJson() {
    const { filteredSneakers, allowedSneakerIds, filteredSales } = this.getFilteredData();

    // Obtener estadísticas calculadas sobre los conjuntos estrictamente filtrados
    const inventorySummary = sneakerService.getStats({
      brand: this.activeFilters.brand,
      minPrice: this.activeFilters.minPrice,
      maxPrice: this.activeFilters.maxPrice
    });

    const salesSummary = saleService.getStats({
      customer: this.activeFilters.customer,
      startDate: this.activeFilters.startDate,
      endDate: this.activeFilters.endDate,
      sneakerIds: allowedSneakerIds
    });

    const reportData = {
      generatedAt: new Date().toISOString(),
      filtersApplied: { ...this.activeFilters },
      inventorySummary,
      salesSummary,
      sneakers: filteredSneakers,
      sales: filteredSales
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
   * Exporta el reporte consolidado en formato CSV en memoria sanitizando contra CSV Formula Injection
   */
  exportToCsv() {
    const { filteredSales } = this.getFilteredData();

    const headers = ['ID Venta', 'Fecha', 'Cliente', 'Sneaker Vendido', 'Cantidad', 'Precio Unitario', 'Total'];
    const rows = filteredSales.map(s => [
      sanitizeCsvCell(s.id),
      sanitizeCsvCell(s.fecha),
      sanitizeCsvCell(s.cliente),
      sanitizeCsvCell(s.sneakerSummary),
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
