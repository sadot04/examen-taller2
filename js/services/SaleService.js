import { Sale, getLocalDateString } from '../models/Sale.js';
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
    
    // Registrar SaleService en SneakerService para verificación de integridad referencial cruzada
    sneakerService.setSaleService(this);
    this.loadSeedData();
  }

  /**
   * Verifica si existen ventas registradas para un ID de sneaker dado
   * @param {string|number} sneakerId
   * @returns {boolean}
   */
  hasSalesForSneaker(sneakerId) {
    const targetId = String(sneakerId);
    return this.sales.some(s => s.sneakerId === targetId);
  }

  /**
   * Carga ventas semilla de prueba con fechas de negocio locales
   */
  loadSeedData() {
    const sneakers = sneakerService.listar();
    if (sneakers.length >= 2) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      this.crear({
        cliente: 'Carlos Mendoza',
        fecha: getLocalDateString(today),
        sneakerId: sneakers[0].id,
        cantidad: 1,
        precioUnitario: sneakers[0].precio
      });

      this.crear({
        cliente: 'Valeria Rojas',
        fecha: getLocalDateString(yesterday),
        sneakerId: sneakers[1].id,
        cantidad: 2,
        precioUnitario: sneakers[1].precio
      });
    }
  }

  /**
   * CREAR VENTA (Alta con descuento de stock atómico tras validación)
   * @param {Object} data
   * @returns {{success: boolean, data?: Sale, errors?: string[]}}
   */
  crear(data) {
    const rawCantidad = Number(data.cantidad);
    const sneaker = sneakerService.buscarPorId(data.sneakerId);
    
    if (!sneaker) {
      return { success: false, errors: ['El sneaker seleccionado no existe en inventario.'] };
    }

    const precioUnitario = Number(data.precioUnitario !== undefined ? data.precioUnitario : sneaker.precio);
    const fecha = data.fecha || getLocalDateString();
    const sneakerSummary = `${sneaker.marca} ${sneaker.modelo} (US ${sneaker.talla}) [${sneaker.sku}]`;

    // 1. Construir y validar el objeto de venta completo antes de mutar el stock
    const prospectiveSale = new Sale({
      ...data,
      id: String(this.nextId),
      cliente: data.cliente,
      fecha,
      sneakerId: sneaker.id,
      cantidad: rawCantidad,
      precioUnitario,
      total: rawCantidad * precioUnitario,
      sneakerSummary
    });

    const validation = prospectiveSale.validate();
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // 2. Validar disponibilidad de stock
    if (sneaker.stock < rawCantidad) {
      return {
        success: false,
        errors: [`Stock insuficiente para "${sneaker.marca} - ${sneaker.modelo}". Disponible: ${sneaker.stock} pares, Solicitado: ${rawCantidad}.`]
      };
    }

    // 3. Aplicar descuento de stock atómicamente y verificar resultado
    const updateResult = sneakerService.actualizar(sneaker.id, {
      stock: sneaker.stock - rawCantidad
    });

    if (!updateResult || updateResult.success === false) {
      return {
        success: false,
        errors: updateResult?.errors || ['Error al actualizar el stock del sneaker.']
      };
    }

    this.nextId++;
    this.sales.unshift(prospectiveSale);
    return { success: true, data: prospectiveSale };
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
   * ACTUALIZAR VENTA (Modificación segura con validación previa y stock atómico)
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
    const rawCantidad = data.cantidad !== undefined ? Number(data.cantidad) : currentSale.cantidad;

    const targetSneaker = sneakerService.buscarPorId(newSneakerId);
    if (!targetSneaker) {
      return { success: false, errors: ['El sneaker seleccionado no existe en el inventario activo.'] };
    }

    const newPrecioUnitario = Number(data.precioUnitario !== undefined ? data.precioUnitario : targetSneaker.precio);
    const newTotal = rawCantidad * newPrecioUnitario;
    const updatedSummary = `${targetSneaker.marca} ${targetSneaker.modelo} (US ${targetSneaker.talla}) [${targetSneaker.sku}]`;

    // 1. Construir la venta prospectiva y validar TODOS los campos antes de tocar inventario
    const prospectiveSale = new Sale({
      ...currentSale,
      ...data,
      id: currentSale.id,
      cliente: data.cliente !== undefined ? data.cliente : currentSale.cliente,
      fecha: data.fecha || currentSale.fecha,
      sneakerId: newSneakerId,
      cantidad: rawCantidad,
      precioUnitario: newPrecioUnitario,
      total: newTotal,
      sneakerSummary: updatedSummary,
      createdAt: currentSale.createdAt
    });
    prospectiveSale.updatedAt = new Date().toISOString();

    const validation = prospectiveSale.validate();
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // 2. Verificar disponibilidad de stock
    if (newSneakerId === currentSale.sneakerId) {
      const delta = rawCantidad - currentSale.cantidad;
      if (delta > 0 && targetSneaker.stock < delta) {
        return {
          success: false,
          errors: [`Stock insuficiente para aumentar la venta. Disponible adicional: ${targetSneaker.stock}, Requerido: ${delta}.`]
        };
      }
    } else {
      if (targetSneaker.stock < rawCantidad) {
        return {
          success: false,
          errors: [`Stock insuficiente en el nuevo sneaker "${targetSneaker.modelo}". Disponible: ${targetSneaker.stock}, Requerido: ${rawCantidad}.`]
        };
      }
    }

    // 3. Aplicar ajustes de stock de manera atómica con rollback seguro
    if (newSneakerId === currentSale.sneakerId) {
      const delta = rawCantidad - currentSale.cantidad;
      if (delta !== 0) {
        const updateResult = sneakerService.actualizar(targetSneaker.id, {
          stock: targetSneaker.stock - delta
        });
        if (!updateResult || updateResult.success === false) {
          return {
            success: false,
            errors: updateResult?.errors || ['Error al ajustar el stock del sneaker.']
          };
        }
      }
    } else {
      const oldSneaker = sneakerService.buscarPorId(currentSale.sneakerId);
      
      // Descontar primero del nuevo sneaker
      const targetUpdate = sneakerService.actualizar(targetSneaker.id, {
        stock: targetSneaker.stock - rawCantidad
      });

      if (!targetUpdate || targetUpdate.success === false) {
        return {
          success: false,
          errors: targetUpdate?.errors || ['Error al descontar stock del nuevo sneaker.']
        };
      }

      // Reponer stock al sneaker anterior
      if (oldSneaker) {
        const oldUpdate = sneakerService.actualizar(oldSneaker.id, {
          stock: oldSneaker.stock + currentSale.cantidad
        });

        if (!oldUpdate || oldUpdate.success === false) {
          // Rollback: revertir descuento en el nuevo sneaker
          sneakerService.actualizar(targetSneaker.id, {
            stock: targetSneaker.stock
          });
          return {
            success: false,
            errors: oldUpdate?.errors || ['Error al reponer stock del sneaker original. Operación revertida.']
          };
        }
      }
    }

    // 4. Persistir la venta validada
    this.sales[index] = prospectiveSale;
    return { success: true, data: prospectiveSale };
  }

  // Alias
  update(id, data) {
    return this.actualizar(id, data);
  }

  /**
   * ELIMINAR / ANULAR VENTA (Reponer stock automáticamente en memoria)
   * @param {string|number} id
   * @returns {{success: boolean, errors?: string[]}|boolean}
   */
  eliminar(id) {
    const sale = this.buscarPorId(id);
    if (!sale) {
      return { success: false, errors: ['Venta no encontrada.'] };
    }

    // Reponer el stock en SneakerService
    const sneaker = sneakerService.buscarPorId(sale.sneakerId);
    if (!sneaker) {
      return {
        success: false,
        errors: [`No se puede anular la venta #VNT-${sale.id} porque el sneaker asociado (#${sale.sneakerId}) ya no existe en el inventario.`]
      };
    }

    // Reponer stock y verificar éxito
    const updateResult = sneakerService.actualizar(sneaker.id, {
      stock: sneaker.stock + sale.cantidad
    });

    if (!updateResult || updateResult.success === false) {
      return {
        success: false,
        errors: updateResult?.errors || ['Error al reponer el stock del sneaker.']
      };
    }

    this.sales = this.sales.filter(s => s.id !== String(id));
    return { success: true };
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
