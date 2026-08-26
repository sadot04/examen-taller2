import { Sneaker } from '../models/Sneaker.js';

/**
 * SneakerService
 * Maneja las operaciones CRUD (ABM) de inventario completamente en memoria.
 */
class SneakerService {
  constructor() {
    /** @type {Sneaker[]} */
    this.sneakers = [];
    this.nextId = 1;
    this.loadSeedData();
  }

  /**
   * Carga datos iniciales de muestra para pruebas
   */
  loadSeedData() {
    const seedData = [
      {
        brand: 'Nike',
        model: 'Air Jordan 1 Retro High OG',
        size: 10.5,
        price: 180.00,
        stock: 12,
        sku: 'DZ5485-612',
        category: 'Basketball',
        colorway: 'Chicago Lost & Found',
        imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80'
      },
      {
        brand: 'Adidas',
        model: 'Yeezy Boost 350 V2',
        size: 9.0,
        price: 230.00,
        stock: 5,
        sku: 'HQ7045',
        category: 'Lifestyle',
        colorway: 'Onyx',
        imageUrl: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=600&q=80'
      },
      {
        brand: 'New Balance',
        model: '550 White Green',
        size: 11.0,
        price: 120.00,
        stock: 20,
        sku: 'BB550WT1',
        category: 'Lifestyle',
        colorway: 'White / Green',
        imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80'
      },
      {
        brand: 'Nike',
        model: 'Dunk Low Retro',
        size: 8.5,
        price: 115.00,
        stock: 2,
        sku: 'DD1391-100',
        category: 'Skate',
        colorway: 'Panda White/Black',
        imageUrl: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=600&q=80'
      }
    ];

    seedData.forEach(item => this.create(item));
  }

  /**
   * Obtiene todos los sneakers con opciones de filtrado y búsqueda
   * @param {Object} [filters]
   * @param {string} [filters.search] - Búsqueda por texto (marca, modelo, sku)
   * @param {string} [filters.brand] - Filtro por marca
   * @param {string} [filters.category] - Filtro por categoría
   * @returns {Sneaker[]}
   */
  getAll({ search = '', brand = '', category = '' } = {}) {
    let result = [...this.sneakers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.model.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        s.colorway.toLowerCase().includes(q)
      );
    }

    if (brand && brand !== 'ALL') {
      result = result.filter(s => s.brand.toLowerCase() === brand.toLowerCase());
    }

    if (category && category !== 'ALL') {
      result = result.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }

    return result;
  }

  /**
   * Obtiene un sneaker por su ID
   * @param {string|number} id
   * @returns {Sneaker|null}
   */
  getById(id) {
    const targetId = String(id);
    return this.sneakers.find(s => s.id === targetId) || null;
  }

  /**
   * Crea un nuevo registro en memoria (Alta)
   * @param {Object} data
   * @returns {{success: boolean, data?: Sneaker, errors?: string[]}}
   */
  create(data) {
    const id = String(this.nextId++);
    const sneaker = new Sneaker({ ...data, id });
    const validation = sneaker.validate();

    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // Verificar SKU duplicado
    const skuExists = this.sneakers.some(s => s.sku === sneaker.sku);
    if (skuExists) {
      return { success: false, errors: [`El SKU "${sneaker.sku}" ya se encuentra registrado.`] };
    }

    this.sneakers.unshift(sneaker);
    return { success: true, data: sneaker };
  }

  /**
   * Actualiza un registro existente (Modificación)
   * @param {string|number} id
   * @param {Object} data
   * @returns {{success: boolean, data?: Sneaker, errors?: string[]}}
   */
  update(id, data) {
    const index = this.sneakers.findIndex(s => s.id === String(id));
    if (index === -1) {
      return { success: false, errors: ['Sneaker no encontrado.'] };
    }

    const current = this.sneakers[index];
    const updatedSneaker = new Sneaker({
      ...current,
      ...data,
      id: current.id,
      createdAt: current.createdAt
    });
    updatedSneaker.updatedAt = new Date().toISOString();

    const validation = updatedSneaker.validate();
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // Comprobar SKU duplicado contra otros registros
    const duplicateSku = this.sneakers.some(s => s.sku === updatedSneaker.sku && s.id !== String(id));
    if (duplicateSku) {
      return { success: false, errors: [`El SKU "${updatedSneaker.sku}" pertenece a otro producto.`] };
    }

    this.sneakers[index] = updatedSneaker;
    return { success: true, data: updatedSneaker };
  }

  /**
   * Elimina un registro de la memoria (Baja)
   * @param {string|number} id
   * @returns {boolean}
   */
  delete(id) {
    const initialLength = this.sneakers.length;
    this.sneakers = this.sneakers.filter(s => s.id !== String(id));
    return this.sneakers.length < initialLength;
  }

  /**
   * Obtiene métricas y estadísticas del inventario
   */
  getStats() {
    const totalItems = this.sneakers.length;
    const totalPairs = this.sneakers.reduce((sum, s) => sum + s.stock, 0);
    const totalInventoryValue = this.sneakers.reduce((sum, s) => sum + (s.price * s.stock), 0);
    const lowStockCount = this.sneakers.filter(s => s.stock <= 3).length;

    // Conteo por marcas
    const brandCounts = this.sneakers.reduce((acc, s) => {
      acc[s.brand] = (acc[s.brand] || 0) + s.stock;
      return acc;
    }, {});

    return {
      totalItems,
      totalPairs,
      totalInventoryValue,
      lowStockCount,
      brandCounts
    };
  }
}

export const sneakerService = new SneakerService();
