import { sneakerService } from '../services/SneakerService.js';

export const StatsView = {
  render(container) {
    const stats = sneakerService.getStats();

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <div class="stat-label">Modelos Registrados</div>
            <div class="stat-value">${stats.totalItems}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">👟</div>
          <div class="stat-info">
            <div class="stat-label">Pares en Stock</div>
            <div class="stat-value">${stats.totalPairs}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-label">Valor Total Inventario</div>
            <div class="stat-value">$${stats.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <div class="stat-label">Stock Crítico (&le;3)</div>
            <div class="stat-value" style="color: ${stats.lowStockCount > 0 ? 'var(--danger)' : 'var(--text-primary)'};">
              ${stats.lowStockCount}
            </div>
          </div>
        </div>
      </div>

      <div class="glass-panel" style="margin-top: 24px;">
        <h3 style="margin-bottom: 16px; font-size: 1.1rem;">Distribución de Stock por Marca</h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${Object.entries(stats.brandCounts).map(([brand, count]) => {
            const percentage = stats.totalPairs > 0 ? Math.round((count / stats.totalPairs) * 100) : 0;
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
