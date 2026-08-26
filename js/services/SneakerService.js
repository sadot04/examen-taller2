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
   * Carga al menos 3 datos semilla iniciales de prueba
   */
  loadSeedData() {
    const seedData = [
      {
        modelo: 'Air Jordan 1 Retro High OG',
        marca: 'Nike',
        talla: 10.5,
        color: 'Chicago (Rojo / Blanco / Negro)',
        precio: 180.00,
        stock: 12,
        category: 'Basketball',
        imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80'
      },
      {
        modelo: 'Yeezy Boost 350 V2',
        marca: 'Adidas',
        talla: 9.0,
        color: 'Onyx Negro',
        precio: 230.00,
        stock: 4,
        category: 'Lifestyle',
        imageUrl: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=600&q=80'
      },
      {
        modelo: '550 Vintage White',
        marca: 'New Balance',
        talla: 11.0,
        color: 'Blanco / Verde Bosque',
        precio: 120.00,
        stock: 18,
        category: 'Lifestyle',
        imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80'
      },
      {
        modelo: 'Dunk Low Retro Panda',
        marca: 'Nike',
        talla: 8.5,
        color: 'Blanco / Negro',
        precio: 115.00,
        stock: 2,
        category: 'Skate',
        imageUrl: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=600&q=80'
      }
    ];

    seedData.forEach(item => this.crear(item));
  }

  /**
   * CREAR (Create)
   * Agrega un nuevo sneaker al arreglo en memoria
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

    this.sneakers.unshift(sneaker);
    return { success: true, data: sneaker };
  }

  // Alias en inglés
  create(data) {
    return this.crear(data);
  }

  /**
   * LISTAR (Read all)
   * Retorna una copia de todos los sneakers en memoria o filtrados
   * @param {Object} [filtros]
   * @param {string} [filtros.search] - Búsqueda por modelo, marca o color
   * @param {string} [filtros.marca] - Filtro por marca
   * @returns {Sneaker[]}
   */
  listar({ search = '', marca = '', brand = '' } = {}) {
    let result = [...this.sneakers];
    const filterBrand = marca || brand;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.modelo.toLowerCase().includes(q) ||
        s.marca.toLowerCase().includes(q) ||
        s.color.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q)
      );
    }

    if (filterBrand && filterBrand !== 'ALL') {
      result = result.filter(s => s.marca.toLowerCase() === filterBrand.toLowerCase());
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
   * ACTUALIZAR (Update)
   * Actualiza los datos de un sneaker existente en memoria
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
