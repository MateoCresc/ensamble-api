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

  async delete(id) {
    const index = this.#materiales.findIndex((m) => m.id === Number(id));
    if (index === -1) return false;

    this.#materiales.splice(index, 1);
    return true;
  }
}

export default MaterialesMemoryDao;
