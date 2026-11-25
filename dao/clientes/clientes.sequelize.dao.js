import { UniqueConstraintError, ForeignKeyConstraintError, fn, col, where } from "sequelize";
import { AppError } from "../../errors/AppError.js";

// Adaptador DAO de Clientes con Sequelize (design D3). Misma interfaz que ClientesMemoryDao:
// devuelve objetos planos (nunca instancias del ORM) y null/false cuando no encuentra.

const ATRIBUTOS = ["id", "nombre", "email", "telefono"];
const CAMPOS_EDITABLES = ["nombre", "email", "telefono"];

const plano = (registro) => (registro ? Object.fromEntries(ATRIBUTOS.map((a) => [a, registro.get(a)])) : null);

// Si la base rechaza un email repetido (por ejemplo, dos altas simultáneas), se traduce al mismo
// error de dominio que lanza el caso de uso, como hace LoansSequelizeDao en la cursada.
const traducirUnicidad = (error) => {
  if (error instanceof UniqueConstraintError) {
    return new AppError("EMAIL_DUPLICADO", "Ya existe un cliente con ese email", 409);
  }
  return error;
};

export class ClientesSequelizeDao {
  #Cliente;

  constructor({ ClienteModel }) {
    this.#Cliente = ClienteModel;
  }

  async getAll() {
    const clientes = await this.#Cliente.findAll({ attributes: ATRIBUTOS, order: [["id", "ASC"]] });
    return clientes.map(plano);
  }

  async getById(id) {
    return plano(await this.#Cliente.findByPk(Number(id), { attributes: ATRIBUTOS }));
  }

  async getByEmail(email) {
    const cliente = await this.#Cliente.findOne({
      attributes: ATRIBUTOS,
      where: where(fn("lower", col("email")), String(email).toLowerCase()),
    });
    return plano(cliente);
  }

  async save(data) {
    try {
      const creado = await this.#Cliente.create({
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono ?? null,
      });
      return this.getById(creado.id);
    } catch (error) {
      throw traducirUnicidad(error);
    }
  }

  async update(id, changes) {
    const cliente = await this.#Cliente.findByPk(Number(id));
    if (!cliente) return null;

    const cambios = Object.fromEntries(CAMPOS_EDITABLES.filter((c) => c in changes).map((c) => [c, changes[c]]));
    try {
      await cliente.update(cambios);
    } catch (error) {
      throw traducirUnicidad(error);
    }
    return this.getById(id);
  }

  async delete(id) {
    // La FK RESTRICT de la base respalda la regla del caso de uso (design D1 de encargos).
    try {
      const borrados = await this.#Cliente.destroy({ where: { id: Number(id) } });
      return borrados > 0;
    } catch (error) {
      if (error instanceof ForeignKeyConstraintError) {
        throw new AppError("CLIENTE_CON_ENCARGOS", "No se puede eliminar un cliente que tiene encargos", 409);
      }
      throw error;
    }
  }
}

export default ClientesSequelizeDao;
