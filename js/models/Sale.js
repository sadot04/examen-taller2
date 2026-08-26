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
   * @param {string} [data.fecha] - Fecha en formato YYYY-MM-DD (por defecto hoy)
   * @param {string|number} data.sneakerId - ID del sneaker vendido
   * @param {number} data.cantidad - Cantidad de pares vendidos (entero positivo)
   * @param {number} data.precioUnitario - Precio unitario al momento de la venta
   * @param {number} [data.total] - Total calculado (cantidad * precioUnitario)
   * @param {string} [data.sneakerSummary] - Resumen descriptivo del sneaker (ej. Nike Air Jordan 1)
   */
  constructor({
    id = null,
    cliente,
    fecha,
    sneakerId,
    cantidad,
    precioUnitario,
    total,
    sneakerSummary = ''
  } = {}) {
    this.id = id ? String(id) : null;
    this.cliente = (cliente || '').trim();
    this.fecha = fecha || new Date().toISOString().split('T')[0];
    this.sneakerId = sneakerId ? String(sneakerId) : '';
    this.cantidad = parseInt(cantidad, 10) || 0;
    this.precioUnitario = Number(precioUnitario) || 0;
    this.total = Number(total !== undefined ? total : (this.cantidad * this.precioUnitario)) || 0;
    this.sneakerSummary = (sneakerSummary || '').trim();
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

    if (this.cantidad <= 0 || isNaN(this.cantidad)) {
      errors.push('La "cantidad" debe ser un número entero mayor a 0.');
    }

    if (this.precioUnitario <= 0 || isNaN(this.precioUnitario)) {
      errors.push('El "precioUnitario" debe ser mayor a 0.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
