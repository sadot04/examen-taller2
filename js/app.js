import { InventoryView } from './views/inventoryView.js';
import { StatsView } from './views/statsView.js';
import { CatalogView } from './views/brandView.js';

class App {
  constructor() {
    this.currentView = 'inventory';
    this.views = {
      inventory: {
        title: 'Gestión de Inventario (ABM)',
        subtitle: 'Administración y control de existencias en memoria',
        handler: InventoryView
      },
      stats: {
        title: 'Métricas y Estadísticas',
        subtitle: 'Resumen ejecutivo y KPIs de stock',
        handler: StatsView
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
    this.navigateTo('inventory');
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
  }

  navigateTo(viewKey) {
    if (!this.views[viewKey]) return;

    this.currentView = viewKey;
    const viewConfig = this.views[viewKey];

    // Actualizar estados visuales de navegación
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewKey);
    });

    // Actualizar encabezados
    document.getElementById('current-page-title').textContent = viewConfig.title;
    document.getElementById('current-page-desc').textContent = viewConfig.subtitle;

    // Renderizar vista
    const contentBody = document.getElementById('view-container');
    viewConfig.handler.render(contentBody);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
