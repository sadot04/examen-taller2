import { Sale } from '../models/Sale.js';
import { sneakerService } from './SneakerService.js';

/**
 * SaleService
 * Maneja las operaciones CRUD (ABM) de Ventas y la sincronización en memoria con SneakerService.
 */
class SaleService {
  constructor() {
    /** @type {Sale[]} */
    this.sales = [];
    this.nextId = 1;
    this.loadSeedData();
  }

  /**
   * Carga ventas semilla de prueba
   */
  loadSeedData() {
    const sneakers = sneakerService.listar();
    if (sneakers.length >= 2) {
      this.crear({
        cliente: 'Carlos Mendoza',
        fecha: new Date().toISOString().split('T')[0],
        sneakerId: sneakers[0].id,
        cantidad: 1,
        precioUnitario: sneakers[0].precio
      });

      this.crear({
        cliente: 'Valeria Rojas',
        fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        sneakerId: sneakers[1].id,
        cantidad: 2,
        precioUnitario: sneakers[1].precio
      });
    }
  }

  /**
   * CREAR VENTA (Alta con descuento de stock)
   * @param {Object} data
   * @returns {{success: boolean, data?: Sale, errors?: string[]}}
   */
  crear(data) {
    const sneaker = sneakerService.buscarPorId(data.sneakerId);
    if (!sneaker) {
      return { success: false, errors: ['El sneaker seleccionado no existe en inventario.'] };
    }

    const cantidad = parseInt(data.cantidad, 10) || 0;
    const precioUnitario = Number(data.precioUnitario !== undefined ? data.precioUnitario : sneaker.precio);

    if (cantidad <= 0) {
      return { success: false, errors: ['La cantidad a vender debe ser al menos 1 par.'] };
    }

    // Validar disponibilidad de stock
    if (sneaker.stock < cantidad) {
      return {
        success: false,
        errors: [`Stock insuficiente para "${sneaker.marca} - ${sneaker.modelo}". Disponible: ${sneaker.stock} pares, Solicitado: ${cantidad}.`]
      };
    }

    const id = String(this.nextId++);
    const total = cantidad * precioUnitario;
    const sneakerSummary = `${sneaker.marca} ${sneaker.modelo} (US ${sneaker.talla}) [${sneaker.sku}]`;

    const sale = new Sale({
      ...data,
      id,
      cantidad,
      precioUnitario,
      total,
      sneakerSummary
    });

    const validation = sale.validate();
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // Descontar stock en memoria
    sneakerService.actualizar(sneaker.id, {
      stock: sneaker.stock - cantidad
    });

    this.sales.unshift(sale);
    return { success: true, data: sale };
  }

  // Alias
  create(data) {
    return this.crear(data);
  }

  /**
   * LISTAR VENTAS
   * @param {Object} [filtros]
   * @param {string} [filtros.search] - Búsqueda por cliente o sneaker
   * @param {string} [filtros.fecha] - Filtrar por fecha exacta
   * @returns {Sale[]}
   */
  listar({ search = '', fecha = '' } = {}) {
    let result = [...this.sales];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.cliente.toLowerCase().includes(q) ||
        s.sneakerSummary.toLowerCase().includes(q)
      );
    }

    if (fecha) {
      result = result.filter(s => s.fecha === fecha);
    }

    return result;
  }

  // Alias
  getAll(filters) {
    return this.listar(filters);
  }

  /**
   * BUSCAR VENTA POR ID
   * @param {string|number} id
   * @returns {Sale|null}
   */
  buscarPorId(id) {
    const targetId = String(id);
    return this.sales.find(s => s.id === targetId) || null;
  }

  // Alias
  getById(id) {
    return this.buscarPorId(id);
  }

  /**
   * ACTUALIZAR VENTA (Modificación con ajuste de stock en memoria)
   * @param {string|number} id
   * @param {Object} data
   * @returns {{success: boolean, data?: Sale, errors?: string[]}}
   */
  actualizar(id, data) {
    const index = this.sales.findIndex(s => s.id === String(id));
    if (index === -1) {
      return { success: false, errors: ['Venta no encontrada en memoria.'] };
    }

    const currentSale = this.sales[index];
    const newSneakerId = data.sneakerId ? String(data.sneakerId) : currentSale.sneakerId;
    const newCantidad = data.cantidad !== undefined ? parseInt(data.cantidad, 10) : currentSale.cantidad;

    const targetSneaker = sneakerService.buscarPorId(newSneakerId);
    if (!targetSneaker) {
      return { success: false, errors: ['El sneaker seleccionado no existe.'] };
    }

    const newPrecioUnitario = Number(data.precioUnitario !== undefined ? data.precioUnitario : targetSneaker.precio);

    // Ajuste de stock:
    if (newSneakerId === currentSale.sneakerId) {
      // Mismo sneaker: calcular diferencia neta
      const delta = newCantidad - currentSale.cantidad; // si > 0 requiere más stock, si < 0 devuelve stock
      if (delta > 0 && targetSneaker.stock < delta) {
        return {
          success: false,
          errors: [`Stock insuficiente para aumentar la venta. Disponible adicional: ${targetSneaker.stock}, Requerido: ${delta}.`]
        };
      }
      // Aplicar ajuste
      sneakerService.actualizar(targetSneaker.id, {
        stock: targetSneaker.stock - delta
      });
    } else {
      // Sneaker diferente: devolver stock al sneaker anterior y descontar del nuevo
      const oldSneaker = sneakerService.buscarPorId(currentSale.sneakerId);
      if (targetSneaker.stock < newCantidad) {
        return {
          success: false,
          errors: [`Stock insuficiente en el nuevo sneaker "${targetSneaker.modelo}". Disponible: ${targetSneaker.stock}, Requerido: ${newCantidad}.`]
        };
      }
      if (oldSneaker) {
        sneakerService.actualizar(oldSneaker.id, {
          stock: oldSneaker.stock + currentSale.cantidad
        });
      }
      sneakerService.actualizar(targetSneaker.id, {
        stock: targetSneaker.stock - newCantidad
      });
    }

    const newTotal = newCantidad * newPrecioUnitario;
    const updatedSummary = `${targetSneaker.marca} ${targetSneaker.modelo} (US ${targetSneaker.talla}) [${targetSneaker.sku}]`;

    const updatedSale = new Sale({
      ...currentSale,
      ...data,
      id: currentSale.id,
      sneakerId: newSneakerId,
      cantidad: newCantidad,
      precioUnitario: newPrecioUnitario,
      total: newTotal,
      sneakerSummary: updatedSummary,
      createdAt: currentSale.createdAt
    });
    updatedSale.updatedAt = new Date().toISOString();

    const validation = updatedSale.validate();
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    this.sales[index] = updatedSale;
    return { success: true, data: updatedSale };
  }

  // Alias
  update(id, data) {
    return this.actualizar(id, data);
  }

  /**
   * ELIMINAR / ANULAR VENTA (Reponer stock automáticamente en memoria)
   * @param {string|number} id
   * @returns {boolean}
   */
  eliminar(id) {
    const sale = this.buscarPorId(id);
    if (!sale) return false;

    // Reponer el stock en SneakerService
    const sneaker = sneakerService.buscarPorId(sale.sneakerId);
    if (sneaker) {
      sneakerService.actualizar(sneaker.id, {
        stock: sneaker.stock + sale.cantidad
      });
    }

    this.sales = this.sales.filter(s => s.id !== String(id));
    return true;
  }

  // Alias
  delete(id) {
    return this.eliminar(id);
  }

  /**
   * Métricas y resumen de ventas
   */
  getStats() {
    const totalTransactions = this.sales.length;
    const totalPairsSold = this.sales.reduce((sum, s) => sum + s.cantidad, 0);
    const totalRevenue = this.sales.reduce((sum, s) => sum + s.total, 0);

    return {
      totalTransactions,
      totalPairsSold,
      totalRevenue
    };
  }
}

export const saleService = new SaleService();
