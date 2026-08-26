import { Sale, getLocalDateString } from '../models/Sale.js';
import { sneakerService } from './SneakerService.js';

/**
 * SaleService
 * Maneja las operaciones CRUD (ABM) de Ventas con soporte para filtros por cliente y rango de fechas.
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
    const sneakers = sneakerService.getAll();
    if (sneakers.length >= 2) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      this.create({
        cliente: 'Carlos Mendoza',
        fecha: getLocalDateString(today),
        sneakerId: sneakers[0].id,
        cantidad: 2,
        precioUnitario: sneakers[0].price
      });

      this.create({
        cliente: 'Valeria Rojas',
        fecha: getLocalDateString(yesterday),
        sneakerId: sneakers[1].id,
        cantidad: 1,
        precioUnitario: sneakers[1].price
      });

      this.create({
        cliente: 'Carlos Mendoza',
        fecha: getLocalDateString(yesterday),
        sneakerId: sneakers[0].id,
        cantidad: 1,
        precioUnitario: sneakers[0].price
      });
    }
  }

  /**
   * CREAR VENTA (Alta con descuento de stock atómico tras validación)
   * @param {Object} data
   * @returns {{success: boolean, data?: Sale, errors?: string[]}}
   */
  create(data) {
    const rawCantidad = Number(data.cantidad !== undefined ? data.cantidad : data.quantity);
    const targetId = String(data.sneakerId || '');
    const sneaker = sneakerService.getById(targetId);
    
    if (!sneaker) {
      return { success: false, errors: ['El sneaker seleccionado no existe en inventario.'] };
    }

    const unitPrice = Number(data.precioUnitario !== undefined ? data.precioUnitario : (data.unitPrice !== undefined ? data.unitPrice : sneaker.price));
    const saleDate = data.fecha || data.date || getLocalDateString();
    const customerName = data.cliente || data.customer || '';
    const sneakerSummary = `${sneaker.brand} ${sneaker.model} (US ${sneaker.size}) [${sneaker.sku}]`;

    // 1. Construir y validar el objeto de venta completo antes de mutar el stock
    const prospectiveSale = new Sale({
      ...data,
      id: String(this.nextId),
      cliente: customerName,
      fecha: saleDate,
      sneakerId: sneaker.id,
      cantidad: rawCantidad,
      precioUnitario: unitPrice,
      total: rawCantidad * unitPrice,
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
        errors: [`Stock insuficiente para "${sneaker.brand} - ${sneaker.model}". Disponible: ${sneaker.stock} pares, Solicitado: ${rawCantidad}.`]
      };
    }

    // 3. Aplicar descuento de stock atómicamente y verificar resultado
    const updateResult = sneakerService.update(sneaker.id, {
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
  crear(data) {
    return this.create(data);
  }

  /**
   * LISTAR VENTAS con soporte para filtros por cliente, texto y rango de fechas
   * @param {Object} [filtros]
   * @param {string} [filtros.search] - Búsqueda por texto (cliente o resumen de sneaker)
   * @param {string} [filtros.customer] - Filtro por cliente específico
   * @param {string} [filtros.cliente] - Alias de cliente
   * @param {string} [filtros.startDate] - Fecha inicio (YYYY-MM-DD)
   * @param {string} [filtros.endDate] - Fecha fin (YYYY-MM-DD)
   * @param {string} [filtros.fecha] - Fecha exacta
   * @returns {Sale[]}
   */
  getAll({ search = '', customer = '', cliente = '', startDate = '', endDate = '', fecha = '' } = {}) {
    let result = [...this.sales];
    const targetCustomer = customer || cliente;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        (s.cliente && s.cliente.toLowerCase().includes(q)) ||
        (s.sneakerSummary && s.sneakerSummary.toLowerCase().includes(q))
      );
    }

    if (targetCustomer && targetCustomer !== 'ALL') {
      result = result.filter(s => s.cliente.toLowerCase() === targetCustomer.toLowerCase());
    }

    if (fecha) {
      result = result.filter(s => s.fecha === fecha);
    }

    if (startDate) {
      result = result.filter(s => s.fecha >= startDate);
    }

    if (endDate) {
      result = result.filter(s => s.fecha <= endDate);
    }

    return result;
  }

  // Alias
  listar(filters) {
    return this.getAll(filters);
  }

  /**
   * BUSCAR VENTA POR ID
   * @param {string|number} id
   * @returns {Sale|null}
   */
  getById(id) {
    const targetId = String(id);
    return this.sales.find(s => s.id === targetId) || null;
  }

  // Alias
  buscarPorId(id) {
    return this.getById(id);
  }

  /**
   * ACTUALIZAR VENTA (Modificación segura con validación previa y stock atómico)
   * @param {string|number} id
   * @param {Object} data
   * @returns {{success: boolean, data?: Sale, errors?: string[]}}
   */
  update(id, data) {
    const index = this.sales.findIndex(s => s.id === String(id));
    if (index === -1) {
      return { success: false, errors: ['Venta no encontrada en memoria.'] };
    }

    const currentSale = this.sales[index];
    const newSneakerId = data.sneakerId ? String(data.sneakerId) : currentSale.sneakerId;
    const rawCantidad = (data.cantidad !== undefined ? data.cantidad : data.quantity) !== undefined
      ? Number(data.cantidad !== undefined ? data.cantidad : data.quantity)
      : currentSale.cantidad;

    const targetSneaker = sneakerService.getById(newSneakerId);
    if (!targetSneaker) {
      return { success: false, errors: ['El sneaker seleccionado no existe en el inventario activo.'] };
    }

    const newUnitPrice = Number((data.precioUnitario !== undefined ? data.precioUnitario : data.unitPrice) !== undefined
      ? (data.precioUnitario !== undefined ? data.precioUnitario : data.unitPrice)
      : targetSneaker.price);

    const newTotal = rawCantidad * newUnitPrice;
    const updatedSummary = `${targetSneaker.brand} ${targetSneaker.model} (US ${targetSneaker.size}) [${targetSneaker.sku}]`;

    // 1. Construir la venta prospectiva y validar TODOS los campos antes de tocar inventario
    const prospectiveSale = new Sale({
      ...currentSale,
      ...data,
      id: currentSale.id,
      cliente: (data.cliente !== undefined ? data.cliente : data.customer) !== undefined
        ? (data.cliente !== undefined ? data.cliente : data.customer)
        : currentSale.cliente,
      fecha: data.fecha || data.date || currentSale.fecha,
      sneakerId: newSneakerId,
      cantidad: rawCantidad,
      precioUnitario: newUnitPrice,
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
          errors: [`Stock insuficiente en el nuevo sneaker "${targetSneaker.model}". Disponible: ${targetSneaker.stock}, Requerido: ${rawCantidad}.`]
        };
      }
    }

    // 3. Aplicar ajustes de stock de manera atómica con rollback seguro
    if (newSneakerId === currentSale.sneakerId) {
      const delta = rawCantidad - currentSale.cantidad;
      if (delta !== 0) {
        const updateResult = sneakerService.update(targetSneaker.id, {
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
      const oldSneaker = sneakerService.getById(currentSale.sneakerId);
      
      // Descontar primero del nuevo sneaker
      const targetUpdate = sneakerService.update(targetSneaker.id, {
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
        const oldUpdate = sneakerService.update(oldSneaker.id, {
          stock: oldSneaker.stock + currentSale.cantidad
        });

        if (!oldUpdate || oldUpdate.success === false) {
          // Rollback: revertir descuento en el nuevo sneaker
          sneakerService.update(targetSneaker.id, {
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
  actualizar(id, data) {
    return this.update(id, data);
  }

  /**
   * ELIMINAR / ANULAR VENTA (Reponer stock automáticamente en memoria)
   * @param {string|number} id
   * @returns {{success: boolean, errors?: string[]}}
   */
  delete(id) {
    const sale = this.getById(id);
    if (!sale) {
      return { success: false, errors: ['Venta no encontrada.'] };
    }

    // Reponer el stock en SneakerService
    const sneaker = sneakerService.getById(sale.sneakerId);
    if (!sneaker) {
      return {
        success: false,
        errors: [`No se puede anular la venta #VNT-${sale.id} porque el sneaker asociado (#${sale.sneakerId}) ya no existe en el inventario.`]
      };
    }

    // Reponer stock y verificar éxito
    const updateResult = sneakerService.update(sneaker.id, {
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
  eliminar(id) {
    return this.delete(id);
  }

  /**
   * Métricas consolidadas de ventas y productos más vendidos
   */
  getStats() {
    const totalTransactions = this.sales.length;
    const totalPairsSold = this.sales.reduce((sum, s) => sum + s.cantidad, 0);
    const totalRevenue = this.sales.reduce((sum, s) => sum + s.total, 0);

    // Calcular producto más vendido por pares acumulados
    const sneakerSalesMap = {};
    this.sales.forEach(sale => {
      if (!sneakerSalesMap[sale.sneakerId]) {
        sneakerSalesMap[sale.sneakerId] = {
          sneakerId: sale.sneakerId,
          summary: sale.sneakerSummary,
          unitsSold: 0,
          revenueGenerated: 0
        };
      }
      sneakerSalesMap[sale.sneakerId].unitsSold += sale.cantidad;
      sneakerSalesMap[sale.sneakerId].revenueGenerated += sale.total;
    });

    const topSellingProducts = Object.values(sneakerSalesMap).sort((a, b) => b.unitsSold - a.unitsSold);
    const bestSeller = topSellingProducts.length > 0 ? topSellingProducts[0] : null;

    // Lista de clientes únicos
    const uniqueCustomers = [...new Set(this.sales.map(s => s.cliente))].filter(Boolean);

    return {
      totalTransactions,
      totalPairsSold,
      totalRevenue,
      bestSeller,
      topSellingProducts,
      uniqueCustomers
    };
  }
}

export const saleService = new SaleService();
