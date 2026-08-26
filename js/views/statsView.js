import { sneakerService } from '../services/SneakerService.js';
import { saleService } from '../services/SaleService.js';

export const StatsView = {
  render(container) {
    const sneakerStats = sneakerService.getStats();
    const salesStats = saleService.getStats();

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💵</div>
          <div class="stat-info">
            <div class="stat-label">Ingresos por Ventas</div>
            <div class="stat-value" style="color: var(--success);">$${salesStats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🛒</div>
          <div class="stat-info">
            <div class="stat-label">Ventas Concretadas</div>
            <div class="stat-value">${salesStats.totalTransactions} (${salesStats.totalPairsSold} pares)</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">👟</div>
          <div class="stat-info">
            <div class="stat-label">Stock en Depósito</div>
            <div class="stat-value">${sneakerStats.totalPairs} pares</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <div class="stat-label">Stock Crítico (&le;3)</div>
            <div class="stat-value" style="color: ${sneakerStats.lowStockCount > 0 ? 'var(--danger)' : 'var(--text-primary)'};">
              ${sneakerStats.lowStockCount}
            </div>
          </div>
        </div>
      </div>

      <div class="glass-panel" style="margin-top: 24px;">
        <h3 style="margin-bottom: 16px; font-size: 1.1rem;">Distribución de Stock Disponible por Marca</h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${Object.entries(sneakerStats.brandCounts).map(([brand, count]) => {
            const percentage = sneakerStats.totalPairs > 0 ? Math.round((count / sneakerStats.totalPairs) * 100) : 0;
            return `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                  <span><strong>${brand}</strong> (${count} pares)</span>
                  <span style="color: var(--text-secondary);">${percentage}%</span>
                </div>
                <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
                  <div style="width: ${percentage}%; height: 100%; background: var(--accent-gradient);"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
};
