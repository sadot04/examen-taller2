/**
 * Retorna la fecha local en formato YYYY-MM-DD
 * @param {Date} [d=new Date()]
 * @returns {string}
 */
export function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Sale / Venta Model
 * Define el esquema de datos y validaciones para la entidad Venta/Pedido.
 * Campos: id, cliente, fecha (YYYY-MM-DD), sneakerId, cantidad, precioUnitario, total.
 */
export class Sale {
  /**
   * @param {Object} data
   * @param {string|number} [data.id] - Identificador único de la venta
   * @param {string} data.cliente - Nombre del cliente
   * @param {string} [data.fecha] - Fecha en formato YYYY-MM-DD (por defecto fecha local)
   * @param {string|number} data.sneakerId - ID del sneaker vendido
   * @param {number} data.cantidad - Cantidad de pares vendidos (entero positivo)
   * @param {number} data.precioUnitario - Precio unitario al momento de la venta
   * @param {number} [data.total] - Total calculado (cantidad * precioUnitario)
   * @param {string} [data.sneakerSummary] - Resumen descriptivo del sneaker (ej. Nike Air Jordan 1)
   */
  constructor({
    id = null,
    cliente = '',
    fecha,
    sneakerId = '',
    cantidad,
    precioUnitario,
    total,
    sneakerSummary = ''
  } = {}) {
    this.id = id ? String(id) : null;
    this.cliente = String(cliente || '').trim();
    this.fecha = String(fecha || getLocalDateString()).trim();
    this.sneakerId = sneakerId ? String(sneakerId).trim() : '';
    this.cantidad = cantidad !== undefined && cantidad !== null ? Number(cantidad) : NaN;
    this.precioUnitario = precioUnitario !== undefined && precioUnitario !== null ? Number(precioUnitario) : NaN;
    this.total = Number(total !== undefined ? total : (this.cantidad * this.precioUnitario)) || 0;
    this.sneakerSummary = String(sneakerSummary || '').trim();
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Valida los campos de la venta
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];
    if (!this.cliente) errors.push('El nombre del "cliente" es obligatorio.');
    if (!this.sneakerId) errors.push('Debes seleccionar un "sneaker" válido.');
    
    if (!this.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(this.fecha)) {
      errors.push('La "fecha" debe tener un formato válido (YYYY-MM-DD).');
    }

    if (isNaN(this.cantidad) || !Number.isFinite(this.cantidad) || this.cantidad <= 0 || !Number.isInteger(this.cantidad)) {
      errors.push('La "cantidad" debe ser un número entero finito mayor a 0 (ej. 1, 2, 3 pares).');
    }

    if (isNaN(this.precioUnitario) || !Number.isFinite(this.precioUnitario) || this.precioUnitario <= 0) {
      errors.push('El "precioUnitario" debe ser un número finito mayor a 0.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
