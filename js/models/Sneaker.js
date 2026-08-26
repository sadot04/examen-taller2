/**
 * Sneaker Model
 * Define el esquema de datos y validaciones para la entidad Sneaker.
 * Campos: id, modelo, marca, talla (número), color, precio (número), stock (número), sku, categoria.
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
   * @param {string} data.sku - Código SKU único obligatorio
   * @param {string} [data.categoria] - Categoría (Basketball, Lifestyle, Running, Skate)
   * @param {string} [data.category] - Alias de compatibilidad
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
    categoria,
    category,
    imageUrl = 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=400&q=80'
  } = {}) {
    this.id = id ? String(id) : null;
    this.modelo = (modelo !== undefined ? modelo : (model !== undefined ? model : '')).trim();
    this.marca = (marca !== undefined ? marca : (brand !== undefined ? brand : '')).trim();
    this.talla = Number(talla !== undefined ? talla : (size !== undefined ? size : 0)) || 0;
    this.color = (color !== undefined ? color : (colorway !== undefined ? colorway : 'Clásico')).trim();
    this.precio = Number(precio !== undefined ? precio : (price !== undefined ? price : 0)) || 0;
    this.stock = parseInt(stock !== undefined ? stock : 0, 10) || 0;
    this.sku = (sku || '').trim().toUpperCase();
    this.categoria = (categoria !== undefined ? categoria : (category !== undefined ? category : 'Lifestyle')).trim();
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
  get category() { return this.categoria; }

  /**
   * Valida las reglas de negocio del modelo
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];
    if (!this.sku) errors.push('El campo "SKU" es obligatorio y debe ser único.');
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
