import { Sneaker } from '../models/Sneaker.js';

/**
 * SneakerService
 * Maneja las operaciones CRUD puras en memoria:
 * - crear (create)
 * - listar (getAll / list)
 * - buscarPorId (getById)
 * - actualizar (update)
 * - eliminar (delete)
 */
class SneakerService {
  constructor() {
    /** @type {Sneaker[]} */
    this.sneakers = [];
    this.nextId = 1;
    this.loadSeedData();
  }

  /**
   * Carga datos semilla iniciales de prueba con SKUs únicos y categorías
   */
  loadSeedData() {
    const seedData = [
      {
        modelo: 'Air Jordan 1 Retro High OG',
        marca: 'Nike',
        sku: 'DZ5485-612',
        talla: 10.5,
        color: 'Chicago (Rojo / Blanco / Negro)',
        precio: 180.00,
        stock: 12,
        categoria: 'Basketball',
        imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80'
      },
      {
        modelo: 'Yeezy Boost 350 V2',
        marca: 'Adidas',
        sku: 'HQ7045',
        talla: 9.0,
        color: 'Onyx Negro',
        precio: 230.00,
        stock: 4,
        categoria: 'Lifestyle',
        imageUrl: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=600&q=80'
      },
      {
        modelo: '550 Vintage White',
        marca: 'New Balance',
        sku: 'BB550WT1',
        talla: 11.0,
        color: 'Blanco / Verde Bosque',
        precio: 120.00,
        stock: 18,
        categoria: 'Lifestyle',
        imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80'
      },
      {
        modelo: 'Dunk Low Retro Panda',
        marca: 'Nike',
        sku: 'DD1391-100',
        talla: 8.5,
        color: 'Blanco / Negro',
        precio: 115.00,
        stock: 2,
        categoria: 'Skate',
        imageUrl: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=600&q=80'
      }
    ];

    seedData.forEach(item => this.crear(item));
  }

  /**
   * CREAR (Create)
   * Agrega un nuevo sneaker al arreglo en memoria verificando SKU único
   * @param {Object} data
   * @returns {{success: boolean, data?: Sneaker, errors?: string[]}}
   */
  crear(data) {
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

  // Alias en inglés
  create(data) {
    return this.crear(data);
  }

  /**
   * LISTAR (Read all)
   * Retorna una copia de todos los sneakers en memoria filtrados por búsqueda, marca o categoría
   * @param {Object} [filtros]
   * @param {string} [filtros.search] - Búsqueda por modelo, marca, color o SKU
   * @param {string} [filtros.marca] - Filtro por marca
   * @param {string} [filtros.brand] - Alias de filtro por marca
   * @param {string} [filtros.categoria] - Filtro por categoría
   * @param {string} [filtros.category] - Alias de filtro por categoría
   * @returns {Sneaker[]}
   */
  listar({ search = '', marca = '', brand = '', categoria = '', category = '' } = {}) {
    let result = [...this.sneakers];
    const filterBrand = marca || brand;
    const filterCategory = categoria || category;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.modelo.toLowerCase().includes(q) ||
        s.marca.toLowerCase().includes(q) ||
        s.color.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        s.categoria.toLowerCase().includes(q)
      );
    }

    if (filterBrand && filterBrand !== 'ALL') {
      result = result.filter(s => s.marca.toLowerCase() === filterBrand.toLowerCase());
    }

    if (filterCategory && filterCategory !== 'ALL') {
      result = result.filter(s => s.categoria.toLowerCase() === filterCategory.toLowerCase());
    }

    return result;
  }

  // Alias en inglés
  getAll(filters) {
    return this.listar(filters);
  }

  /**
   * BUSCAR POR ID (Find by ID)
   * Encuentra un sneaker por su ID único
   * @param {string|number} id
   * @returns {Sneaker|null}
   */
  buscarPorId(id) {
    const targetId = String(id);
    return this.sneakers.find(s => s.id === targetId) || null;
  }

  // Alias en inglés
  getById(id) {
    return this.buscarPorId(id);
  }

  /**
   * Normaliza los datos de actualización para que los alias en inglés
   * mapeen correctamente a los nombres canónicos en español si estos no fueron suministrados.
   * @param {Object} data
   * @returns {Object}
   */
  _normalizeFields(data = {}) {
    const normalized = { ...data };
    if (data.model !== undefined && data.modelo === undefined) normalized.modelo = data.model;
    if (data.brand !== undefined && data.marca === undefined) normalized.marca = data.brand;
    if (data.size !== undefined && data.talla === undefined) normalized.talla = data.size;
    if (data.colorway !== undefined && data.color === undefined) normalized.color = data.colorway;
    if (data.price !== undefined && data.precio === undefined) normalized.precio = data.price;
    if (data.category !== undefined && data.categoria === undefined) normalized.categoria = data.category;
    return normalized;
  }

  /**
   * ACTUALIZAR (Update)
   * Actualiza los datos de un sneaker existente en memoria verificando SKU único
   * @param {string|number} id
   * @param {Object} data
   * @returns {{success: boolean, data?: Sneaker, errors?: string[]}}
   */
  actualizar(id, data) {
    const index = this.sneakers.findIndex(s => s.id === String(id));
    if (index === -1) {
      return { success: false, errors: ['Sneaker no encontrado en memoria.'] };
    }

    const current = this.sneakers[index];
    const incoming = this._normalizeFields(data);

    const updatedSneaker = new Sneaker({
      ...current,
      ...incoming,
      id: current.id,
      createdAt: current.createdAt
    });
    updatedSneaker.updatedAt = new Date().toISOString();

    const validation = updatedSneaker.validate();
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // Verificar SKU duplicado contra otros registros
    const duplicateSku = this.sneakers.some(s => s.sku === updatedSneaker.sku && s.id !== String(id));
    if (duplicateSku) {
      return { success: false, errors: [`El SKU "${updatedSneaker.sku}" pertenece a otro producto.`] };
    }

    this.sneakers[index] = updatedSneaker;
    return { success: true, data: updatedSneaker };
  }

  // Alias en inglés
  update(id, data) {
    return this.actualizar(id, data);
  }

  /**
   * ELIMINAR (Delete)
   * Elimina un sneaker del arreglo en memoria por su ID
   * @param {string|number} id
   * @returns {boolean}
   */
  eliminar(id) {
    const initialLength = this.sneakers.length;
    this.sneakers = this.sneakers.filter(s => s.id !== String(id));
    return this.sneakers.length < initialLength;
  }

  // Alias en inglés
  delete(id) {
    return this.eliminar(id);
  }

  /**
   * Obtiene estadísticas agregadas del inventario en memoria
   */
  getStats() {
    const totalItems = this.sneakers.length;
    const totalPairs = this.sneakers.reduce((sum, s) => sum + s.stock, 0);
    const totalInventoryValue = this.sneakers.reduce((sum, s) => sum + (s.precio * s.stock), 0);
    const lowStockCount = this.sneakers.filter(s => s.stock <= 3).length;

    const brandCounts = this.sneakers.reduce((acc, s) => {
      acc[s.marca] = (acc[s.marca] || 0) + s.stock;
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
