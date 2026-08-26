import { InventoryView } from './views/inventoryView.js';
import { SalesView } from './views/salesView.js';
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
      sales: {
        title: 'Gestión de Ventas y Pedidos (ABM)',
        subtitle: 'Registro de transacciones y control de stock reactivo',
        handler: SalesView
      },
      stats: {
        title: 'Métricas y Estadísticas',
        subtitle: 'Resumen ejecutivo de stock e ingresos por ventas',
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
    this.navigateTo('sales'); // Iniciar en el módulo de ventas o inventario
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
