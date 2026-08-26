/**
 * Sneaker Model
 * Define el esquema de datos y validaciones para la entidad Sneaker.
 */
export class Sneaker {
  /**
   * @param {Object} data
   * @param {string|number} [data.id]
   * @param {string} data.brand - Marca (e.g., Nike, Adidas, Jordan, New Balance)
   * @param {string} data.model - Modelo (e.g., Air Jordan 1 Retro High)
   * @param {number} data.size - Talla (US)
   * @param {number} data.price - Precio en USD
   * @param {number} data.stock - Cantidad en inventario
   * @param {string} data.sku - Código único de artículo (ej. AJ1-CHI-2023)
   * @param {string} [data.category='Lifestyle'] - Categoría (Basketball, Running, Lifestyle, Skate)
   * @param {string} [data.colorway='Default'] - Combinación de colores
   * @param {string} [data.imageUrl] - URL de imagen representativa
   */
  constructor({
    id = null,
    brand,
    model,
    size,
    price,
    stock,
    sku,
    category = 'Lifestyle',
    colorway = 'Classic',
    imageUrl = 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=400&q=80'
  }) {
    this.id = id ? String(id) : null;
    this.brand = brand?.trim() || '';
    this.model = model?.trim() || '';
    this.size = Number(size) || 0;
    this.price = Number(price) || 0;
    this.stock = parseInt(stock, 10) || 0;
    this.sku = (sku || '').trim().toUpperCase();
    this.category = category;
    this.colorway = colorway.trim();
    this.imageUrl = imageUrl.trim();
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Valida que el objeto cumpla con las reglas mínimas de negocio
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];
    if (!this.brand) errors.push('La marca es obligatoria.');
    if (!this.model) errors.push('El modelo es obligatorio.');
    if (this.size <= 0 || isNaN(this.size)) errors.push('La talla debe ser un número positivo.');
    if (this.price < 0 || isNaN(this.price)) errors.push('El precio debe ser mayor o igual a 0.');
    if (this.stock < 0 || isNaN(this.stock)) errors.push('El stock no puede ser negativo.');
    if (!this.sku) errors.push('El SKU es obligatorio.');

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
