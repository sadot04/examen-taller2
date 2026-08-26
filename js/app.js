import { InventoryView } from './views/inventoryView.js';
import { SalesView } from './views/salesView.js';
import { StatsView } from './views/statsView.js';
import { CatalogView } from './views/brandView.js';

class App {
  constructor() {
    this.currentView = 'stats';
    this.views = {
      stats: {
        title: 'Métricas, KPIs y Filtros Avanzados',
        subtitle: 'Dashboard ejecutivo consolidado con exportación de reportes',
        handler: StatsView
      },
      inventory: {
        title: 'Gestión de Inventario (ABM)',
        subtitle: 'Administración y control de existencias en memoria',
        handler: InventoryView
      },
      sales: {
        title: 'Gestión de Ventas y Pedidos (ABM)',
        subtitle: 'Registro de transacciones y control de stock reactivo',
        handler: SalesView
      },
      catalog: {
        title: 'Catálogo Visual de Sneakers',
        subtitle: 'Vista de tarjetas de productos disponibles',
        handler: CatalogView
      }
    };
  }

  init() {
    this.bindNavigation();
    
    // Si la URL contiene un hash correspondiente a una vista válida, cargarla; si no, ir a 'stats'
    const hash = window.location.hash.replace('#', '');
    const initialView = this.views[hash] ? hash : 'stats';
    this.navigateTo(initialView);
  }

  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');
        this.navigateTo(targetView);
      });
    });

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (this.views[hash] && hash !== this.currentView) {
        this.navigateTo(hash);
      }
    });
  }

  navigateTo(viewKey) {
    if (!this.views[viewKey]) return;

    this.currentView = viewKey;
    const viewConfig = this.views[viewKey];

    // Actualizar hash sin disparar scroll
    if (window.location.hash !== `#${viewKey}`) {
      window.history.replaceState(null, '', `#${viewKey}`);
    }

    // Actualizar estados visuales de navegación
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewKey);
    });

    // Actualizar encabezados
    const titleEl = document.getElementById('current-page-title');
    const descEl = document.getElementById('current-page-desc');
    if (titleEl) titleEl.textContent = viewConfig.title;
    if (descEl) descEl.textContent = viewConfig.subtitle;

    // Renderizar vista
    const contentBody = document.getElementById('view-container');
    if (contentBody) {
      try {
        viewConfig.handler.render(contentBody);
      } catch (err) {
        console.error(`Error renderizando la vista ${viewKey}:`, err);
        contentBody.innerHTML = `
          <div class="glass-panel" style="border-left: 4px solid var(--danger); padding: 24px;">
            <h3 style="color: var(--danger); margin-bottom: 8px;">Error al cargar la sección</h3>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">${err.message}</p>
          </div>
        `;
      }
    }
  }
}

// Inicialización segura garantizando ejecución tanto en carga inmediata como diferida
function startApp() {
  const app = new App();
  app.init();
  window.appInstance = app;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
