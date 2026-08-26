/**
 * Sneaker Model
 * Define el esquema de datos y validaciones para la entidad Sneaker.
 * Campos requeridos: id, modelo, marca, talla (número), color, precio (número), stock (número).
 */
export class Sneaker {
  /**
   * @param {Object} data
   * @param {string|number} [data.id] - Identificador único
   * @param {string} [data.modelo] - Nombre del modelo
   * @param {string} [data.model] - Alias de compatibilidad
   * @param {string} [data.marca] - Fabricante / Marca (e.g. Nike, Adidas, Jordan)
   * @param {string} [data.brand] - Alias de compatibilidad
   * @param {number} [data.talla] - Talla en formato numérico (e.g. 10.5)
   * @param {number} [data.size] - Alias de compatibilidad
   * @param {string} [data.color] - Color o colorway del sneaker
   * @param {string} [data.colorway] - Alias de compatibilidad
   * @param {number} [data.precio] - Precio en formato numérico
   * @param {number} [data.price] - Alias de compatibilidad
   * @param {number} [data.stock] - Cantidad de existencias (número entero >= 0)
   * @param {string} [data.sku] - Código SKU de referencia
   * @param {string} [data.category] - Categoría (Basketball, Lifestyle, Running, Skate)
   * @param {string} [data.imageUrl] - URL de imagen
   */
  constructor({
    id = null,
    modelo,
    model,
    marca,
    brand,
    talla,
    size,
    color,
    colorway,
    precio,
    price,
    stock,
    sku,
    category = 'Lifestyle',
    imageUrl = 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=400&q=80'
  } = {}) {
    this.id = id ? String(id) : null;
    this.modelo = (modelo || model || '').trim();
    this.marca = (marca || brand || '').trim();
    this.talla = Number(talla !== undefined ? talla : size) || 0;
    this.color = (color || colorway || 'Clásico').trim();
    this.precio = Number(precio !== undefined ? precio : price) || 0;
    this.stock = parseInt(stock, 10) || 0;
    this.sku = (sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();
    this.category = category;
    this.imageUrl = (imageUrl || '').trim();
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Getters de conveniencia
  get model() { return this.modelo; }
  get brand() { return this.marca; }
  get size() { return this.talla; }
  get colorway() { return this.color; }
  get price() { return this.precio; }

  /**
   * Valida las reglas de negocio del modelo
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];
    if (!this.modelo) errors.push('El campo "modelo" es obligatorio.');
    if (!this.marca) errors.push('El campo "marca" es obligatorio.');
    if (!this.color) errors.push('El campo "color" es obligatorio.');
    
    if (this.talla <= 0 || isNaN(this.talla)) {
      errors.push('La "talla" debe ser un número mayor a 0 (ej. 8.5, 10).');
    }
    
    if (this.precio <= 0 || isNaN(this.precio)) {
      errors.push('El "precio" debe ser un valor numérico positivo mayor a 0.');
    }
    
    if (this.stock < 0 || isNaN(this.stock)) {
      errors.push('El "stock" debe ser un número entero mayor o igual a 0.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
