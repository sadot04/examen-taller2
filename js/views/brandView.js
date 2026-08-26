import { sneakerService } from '../services/SneakerService.js';

export const CatalogView = {
  render(container) {
    const sneakers = sneakerService.listar();

    container.innerHTML = `
      <div class="glass-panel" style="margin-bottom: 24px;">
        <p style="color: var(--text-secondary); font-size: 0.9rem;">
          Exploración visual del catálogo de calzado disponible en inventario (${sneakers.length} modelos cargados).
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px;">
        ${sneakers.map(s => `
          <div class="glass-panel" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
            <div style="position: relative; height: 190px; background: #131A26; overflow: hidden;">
              <img src="${s.imageUrl}" alt="${s.modelo}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onerror="this.src='https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=400&q=80'">
              <span class="badge badge-brand" style="position: absolute; top: 12px; left: 12px;">${s.marca}</span>
              <span class="badge ${s.stock <= 3 ? 'badge-stock-low' : 'badge-stock-ok'}" style="position: absolute; top: 12px; right: 12px;">
                ${s.stock} en stock
              </span>
            </div>
            <div style="padding: 16px; display: flex; flex-direction: column; flex: 1; justify-content: space-between;">
              <div>
                <h4 style="font-size: 1rem; margin-bottom: 4px; font-weight: 700;">${s.modelo}</h4>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">🎨 ${s.color}</div>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 8px;">
                <span style="font-size: 0.85rem; color: var(--text-secondary);">Talla: <strong>US ${s.talla}</strong></span>
                <span style="font-size: 1.15rem; font-weight: 700; color: #fff;">$${s.precio.toFixed(2)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
};
