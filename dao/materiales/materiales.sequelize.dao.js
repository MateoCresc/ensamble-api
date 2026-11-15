import { UniqueConstraintError, ForeignKeyConstraintError } from "sequelize";
import { AppError } from "../../errors/AppError.js";
import { nombreNormalizado } from "./nombreNormalizado.js";

// Adaptador DAO de Materiales con Sequelize (design D3, D4, D5). Misma interfaz que MaterialesMemoryDao.

const ATRIBUTOS = ["id", "nombre", "unidad", "stock", "stockMinimo"];
const CAMPOS_EDITABLES = ["nombre", "unidad", "stock", "stockMinimo"];

// DECIMAL puede llegar como texto según el driver: se convierte a número para responder igual que memoria.
const plano = (registro) =>
  registro
    ? {
        id: registro.get("id"),
        nombre: registro.get("nombre"),
        unidad: registro.get("unidad"),
        stock: Number(registro.get("stock")),
        stockMinimo: Number(registro.get("stockMinimo")),
      }
    : null;

const traducirUnicidad = (error) => {
  if (error instanceof UniqueConstraintError) {
    return new AppError("MATERIAL_DUPLICADO", "Ya existe un material con ese nombre", 409);
  }
  return error;
};

export class MaterialesSequelizeDao {
  #Material;

  constructor({ MaterialModel }) {
    this.#Material = MaterialModel;
  }

  async getAll() {
    const materiales = await this.#Material.findAll({ attributes: ATRIBUTOS, order: [["id", "ASC"]] });
    return materiales.map(plano);
  }

  async getById(id) {
    return plano(await this.#Material.findByPk(Number(id), { attributes: ATRIBUTOS }));
  }

  async getByNombre(nombre) {
    return plano(
      await this.#Material.findOne({ attributes: ATRIBUTOS, where: { nombreNormalizado: nombreNormalizado(nombre) } })
    );
  }

  async save(data) {
    try {
      const creado = await this.#Material.create({
        nombre: data.nombre,
        nombreNormalizado: nombreNormalizado(data.nombre),
        unidad: data.unidad,
        stock: data.stock ?? 0,
        stockMinimo: data.stockMinimo ?? 0,
      });
      return this.getById(creado.id);
    } catch (error) {
      throw traducirUnicidad(error);
    }
  }

  async update(id, changes) {
    const material = await this.#Material.findByPk(Number(id));
    if (!material) return null;

    const cambios = Object.fromEntries(CAMPOS_EDITABLES.filter((c) => c in changes).map((c) => [c, changes[c]]));
    if ("nombre" in cambios) cambios.nombreNormalizado = nombreNormalizado(cambios.nombre);
    try {
      await material.update(cambios);
    } catch (error) {
      throw traducirUnicidad(error);
    }
    return this.getById(id);
  }

  async delete(id) {
    // La FK RESTRICT de la base respalda la regla del caso de uso (design D1 de encargos).
    try {
      const borrados = await this.#Material.destroy({ where: { id: Number(id) } });
      return borrados > 0;
    } catch (error) {
      if (error instanceof ForeignKeyConstraintError) {
        throw new AppError("MATERIAL_EN_USO", "No se puede eliminar un material que figura en encargos", 409);
      }
      throw error;
    }
  }
}

export default MaterialesSequelizeDao;
