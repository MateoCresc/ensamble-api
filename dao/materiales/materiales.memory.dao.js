import { nombreNormalizado } from "./nombreNormalizado.js";

// Adaptador DAO en memoria para Materiales. Misma interfaz que MaterialesSequelizeDao:
// métodos async que devuelven copias planas y null/false cuando no encuentran.

const CAMPOS_EDITABLES = ["nombre", "unidad", "stock", "stockMinimo"];

// Solo las columnas de la entidad; el id lo asigna el DAO.
const aRegistro = (id, data) => ({
  id,
  nombre: data.nombre,
  unidad: data.unidad,
  stock: data.stock ?? 0,
  stockMinimo: data.stockMinimo ?? 0,
});

// Redondeo a 2 decimales para que 0.3 - 0.1 dé 0.2 (design D5 de encargos).
const redondear = (valor) => Math.round(valor * 100) / 100;

const copia = (material) => (material ? { ...material } : null);

export class MaterialesMemoryDao {
  #materiales = [];
  #nextId = 1;

  async getAll() {
    return this.#materiales.map(copia);
  }

  async getById(id) {
    return copia(this.#materiales.find((m) => m.id === Number(id)));
  }

  // Sin distinguir mayúsculas ni espacios en los extremos (spec "Nombre único de material").
  async getByNombre(nombre) {
    const buscado = nombreNormalizado(nombre);
    return copia(this.#materiales.find((m) => nombreNormalizado(m.nombre) === buscado));
  }

  async save(data) {
    const material = aRegistro(this.#nextId++, data);
    this.#materiales.push(material);
    return copia(material);
  }

  async update(id, changes) {
    const material = this.#materiales.find((m) => m.id === Number(id));
    if (!material) return null;

    for (const campo of CAMPOS_EDITABLES) {
      if (campo in changes) material[campo] = changes[campo];
    }
    return copia(material);
  }

  // Aplica varios movimientos de stock { materialId, delta } todos o ninguno (design D4 de encargos).
  // Es SÍNCRONO a propósito: sin un await entre verificar y escribir, ningún otro pedido puede
  // intercalarse, que es la forma de lograr atomicidad en memoria. Lo usa EncargosMemoryDao.
  // Devuelve false (sin cambiar nada) si algún material no existe o quedaría con stock negativo.
  ajustarStock(movimientos) {
    const nuevos = movimientos.map(({ materialId, delta }) => {
      const material = this.#materiales.find((m) => m.id === Number(materialId));
      return material ? { material, stock: redondear(material.stock + delta) } : null;
    });
    if (nuevos.some((n) => n === null || n.stock < 0)) return false;

    for (const { material, stock } of nuevos) material.stock = stock;
    return true;
  }

  async delete(id) {
    const index = this.#materiales.findIndex((m) => m.id === Number(id));
    if (index === -1) return false;

    this.#materiales.splice(index, 1);
    return true;
  }
}

export default MaterialesMemoryDao;
