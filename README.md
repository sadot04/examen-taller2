# 👟 KicksVault - Sistema de Gestión de Tienda de Sneakers (ABM en Memoria)

Aplicación web ligera con arquitectura limpia modular en **Vanilla JavaScript (ES Modules)**, **HTML5 semántico** y **CSS moderno** para la gestión de inventario y operaciones CRUD (Altas, Bajas, Modificaciones) completamente en memoria.

---

## 🏛️ Arquitectura del Proyecto

```text
├── index.html                  # Layout base, navegación entre módulos y contenedor dinámico
├── .gitignore                  # Exclusión de node_modules, build artifacts, env y logs
├── README.md                   # Documentación técnica
├── css/
│   ├── main.css                # Estilos globales, variables de color/tema y layout
│   └── components.css          # Estilos de componentes (tablas, cards, modales, badges)
└── js/
    ├── app.js                  # Router SPA y orquestador del ciclo de vida
    ├── models/
    │   └── Sneaker.js          # Entidad Sneaker con validación de reglas de negocio
    ├── services/
    │   └── SneakerService.js   # Lógica ABM (CRUD) y almacenamiento en memoria
    └── views/
        ├── inventoryView.js    # Módulo de Inventario (Búsqueda, Filtros, Modal ABM)
        ├── statsView.js        # Módulo de Dashboard y KPIs de stock
        └── brandView.js        # Módulo de Catálogo visual en Cards
```

---

## 🚀 Características Principales

1. **Operaciones ABM (CRUD) Completas en Memoria:**
   - **Alta:** Registro de nuevos pares con validación de campos obligatorios y SKU único.
   - **Baja:** Eliminación con confirmación del producto.
   - **Modificación:** Edición de propiedades con modal interactivo.
   - **Consulta:** Filtrado dinámico por texto (marca, modelo, SKU) y categoría/marca.
2. **Dashboard de Métricas:**
   - Total de modelos, stock acumulado, valor económico del inventario y alerta de stock crítico (&le;3 pares).
3. **Catálogo Visual:**
   - Vista de tarjetas interactivas de calzado.
4. **Cero Dependencias Pesadas:**
   - No requiere `npm install` ni compiladores para ejecutarse. Utiliza estándares web nativos modernos.

---

## 💻 Cómo Ejecutar el Proyecto

Puedes abrir directamente el archivo `index.html` en tu navegador o levantarlo con un servidor local:

### Con VS Code / IDE:
- Usa la extensión **Live Server** haciendo clic derecho sobre `index.html` > *Open with Live Server*.

### Con Python:
```bash
python -m http.server 8000
```

### Con Node.js (npx):
```bash
npx serve .
```
