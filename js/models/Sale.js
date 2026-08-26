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
 * Valida si una cadena en formato YYYY-MM-DD corresponde a una fecha real del calendario (round-trip check)
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1000 || year > 9999) {
    return false;
  }

  // Comprobar con objeto Date local construyendo la fecha y verificando componentes (round-trip)
  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

/**
 * Sale / Venta Model
 * Define el esquema de datos y validaciones para la entidad Venta/Pedido.
 * Campos: id, cliente, fecha (YYYY-MM-DD), sneakerId, cantidad, precioUnitario, total, sneakerSummary, createdAt, updatedAt.
 */
export class Sale {
  /**
   * @param {Object} data
   * @param {string|number} [data.id] - Identificador único de la venta
   * @param {string} data.cliente - Nombre del cliente
   * @param {string} [data.customer] - Alias en inglés
   * @param {string} [data.fecha] - Fecha en formato YYYY-MM-DD (por defecto fecha local)
   * @param {string} [data.date] - Alias en inglés
   * @param {string|number} data.sneakerId - ID del sneaker vendido
   * @param {number} data.cantidad - Cantidad de pares vendidos (entero positivo)
   * @param {number} [data.quantity] - Alias en inglés
   * @param {number} data.precioUnitario - Precio unitario al momento de la venta
   * @param {number} [data.unitPrice] - Alias en inglés
   * @param {number} [data.total] - Total calculado (cantidad * precioUnitario)
   * @param {string} [data.sneakerSummary] - Resumen descriptivo del sneaker
   * @param {string} [data.createdAt] - Timestamp ISO de creación original
   * @param {string} [data.updatedAt] - Timestamp ISO de última modificación
   */
  constructor({
    id = null,
    cliente = '',
    customer = '',
    fecha,
    date,
    sneakerId = '',
    cantidad,
    quantity,
    precioUnitario,
    unitPrice,
    total,
    sneakerSummary = '',
    createdAt,
    updatedAt
  } = {}) {
    this.id = id ? String(id) : null;
    this.cliente = String(cliente || customer || '').trim();
    this.fecha = String(fecha || date || getLocalDateString()).trim();
    this.sneakerId = sneakerId ? String(sneakerId).trim() : '';

    const rawCant = cantidad !== undefined ? cantidad : quantity;
    this.cantidad = rawCant !== undefined && rawCant !== null ? Number(rawCant) : NaN;

    const rawPrice = precioUnitario !== undefined ? precioUnitario : unitPrice;
    this.precioUnitario = rawPrice !== undefined && rawPrice !== null ? Number(rawPrice) : NaN;

    this.total = Number(total !== undefined ? total : (this.cantidad * this.precioUnitario)) || 0;
    this.sneakerSummary = String(sneakerSummary || '').trim();
    this.createdAt = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();
    this.updatedAt = updatedAt ? new Date(updatedAt).toISOString() : new Date().toISOString();
  }

  // Getters de conveniencia
  get customer() { return this.cliente; }
  get date() { return this.fecha; }
  get quantity() { return this.cantidad; }
  get unitPrice() { return this.precioUnitario; }

  /**
   * Valida los campos de la venta verificando que la fecha sea una fecha real del calendario
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];
    if (!this.cliente) errors.push('El nombre del "cliente" es obligatorio.');
    if (!this.sneakerId) errors.push('Debes seleccionar un "sneaker" válido.');
    
    if (!this.fecha || !isValidCalendarDate(this.fecha)) {
      errors.push('La "fecha" debe ser una fecha válida existente en el calendario (formato YYYY-MM-DD).');
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
