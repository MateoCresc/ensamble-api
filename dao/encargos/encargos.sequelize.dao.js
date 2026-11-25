import { Op, literal } from "sequelize";

// Adaptador DAO de Encargos con Sequelize (design D1, D2, D4, D5 de encargos).
// Misma interfaz que EncargosMemoryDao. Las escrituras que tocan varias tablas van en una transacción.

// Señal interna para deshacer una transacción cuando una actualización condicional no afecta filas.
class SinCambios extends Error {}

const CAMPOS_EDITABLES = ["descripcion", "fechaEntregaEstimada"];

export class EncargosSequelizeDao {
  #Encargo;
  #Renglon;
  #Cliente;
  #Material;

  constructor({ EncargoModel, EncargoMaterialModel, ClienteModel, MaterialModel }) {
    this.#Encargo = EncargoModel;
    this.#Renglon = EncargoMaterialModel;
    this.#Cliente = ClienteModel;
    this.#Material = MaterialModel;
  }

  get #sequelize() {
    return this.#Encargo.sequelize;
  }

  // Equivalente al #conRelaciones del DAO en memoria: mismas columnas de cliente y material.
  #include() {
    return [
      { model: this.#Cliente, as: "cliente", attributes: ["id", "nombre"] },
      { model: this.#Material, as: "materiales", attributes: ["id", "nombre", "unidad"], through: { attributes: ["cantidad"] } },
    ];
  }

  #plano(encargo) {
    if (!encargo) return null;
    const materiales = (encargo.materiales ?? [])
      .map((m) => ({ materialId: m.id, nombre: m.nombre, unidad: m.unidad, cantidad: Number(m.EncargoMaterial.cantidad) }))
      .sort((a, b) => a.materialId - b.materialId);
    return {
      id: encargo.id,
      clienteId: encargo.clienteId,
      cliente: encargo.cliente ? { id: encargo.cliente.id, nombre: encargo.cliente.nombre } : null,
      descripcion: encargo.descripcion,
      estado: encargo.estado,
      fechaEntregaEstimada: encargo.fechaEntregaEstimada ?? null,
      materiales,
    };
  }

  #crearRenglones(encargoId, materiales, transaction) {
    return this.#Renglon.bulkCreate(
      materiales.map(({ materialId, cantidad }) => ({ encargoId, materialId, cantidad })),
      { transaction }
    );
  }

  async getAll() {
    const encargos = await this.#Encargo.findAll({ include: this.#include(), order: [["id", "ASC"]] });
    return encargos.map((e) => this.#plano(e));
  }

  async getById(id) {
    return this.#plano(await this.#Encargo.findByPk(Number(id), { include: this.#include() }));
  }

  async save(data) {
    const id = await this.#sequelize.transaction(async (transaction) => {
      const encargo = await this.#Encargo.create(
        {
          clienteId: data.clienteId,
          descripcion: data.descripcion,
          estado: "presupuestado",
          fechaEntregaEstimada: data.fechaEntregaEstimada ?? null,
        },
        { transaction }
      );
      await this.#crearRenglones(encargo.id, data.materiales ?? [], transaction);
      return encargo.id;
    });
    return this.getById(id);
  }

  async update(id, changes) {
    const encontrado = await this.#sequelize.transaction(async (transaction) => {
      const encargo = await this.#Encargo.findByPk(Number(id), { transaction });
      if (!encargo) return false;

      const cambios = Object.fromEntries(CAMPOS_EDITABLES.filter((c) => c in changes).map((c) => [c, changes[c]]));
      await encargo.update(cambios, { transaction });
      if (changes.materiales) {
        await this.#Renglon.destroy({ where: { encargoId: encargo.id }, transaction });
        await this.#crearRenglones(encargo.id, changes.materiales, transaction);
      }
      return true;
    });
    return encontrado ? this.getById(id) : null;
  }

  async delete(id) {
    return this.#sequelize.transaction(async (transaction) => {
      await this.#Renglon.destroy({ where: { encargoId: Number(id) }, transaction });
      return (await this.#Encargo.destroy({ where: { id: Number(id) }, transaction })) > 0;
    });
  }

  async existePorCliente(clienteId) {
    return (await this.#Encargo.count({ where: { clienteId: Number(clienteId) } })) > 0;
  }

  async existePorMaterial(materialId) {
    return (await this.#Renglon.count({ where: { materialId: Number(materialId) } })) > 0;
  }

  // Estado + stock en UNA transacción (design D4), como lend() de la cursada:
  // - UPDATE condicional del estado (solo si sigue siendo uno de `desde`);
  // - por cada movimiento, UPDATE condicional del stock (si descuenta, solo si alcanza).
  // Si alguna actualización no afecta filas se deshace todo y se devuelve null.
  async cambiarEstado(id, { desde, hacia, movimientos = [] }) {
    try {
      await this.#sequelize.transaction(async (transaction) => {
        const [encargos] = await this.#Encargo.update(
          { estado: hacia },
          { where: { id: Number(id), estado: { [Op.in]: desde } }, transaction }
        );
        if (encargos === 0) throw new SinCambios();

        for (const { materialId, delta } of movimientos) {
          const where = { id: Number(materialId) };
          if (delta < 0) where.stock = { [Op.gte]: -delta };
          // ROUND(…, 2): mismo redondeo que el DAO en memoria (design D5).
          const [materiales] = await this.#Material.update(
            { stock: literal(`ROUND(stock + (${Number(delta)}), 2)`) },
            { where, transaction }
          );
          if (materiales === 0) throw new SinCambios();
        }
      });
    } catch (error) {
      if (error instanceof SinCambios) return null;
      throw error;
    }
    return this.getById(id);
  }
}

export default EncargosSequelizeDao;
