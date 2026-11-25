// Adaptador DAO en memoria para Encargos (design D2 de encargos).
// Guarda los encargos y, aparte, sus renglones de materiales (la tabla intermedia EncargoMaterial).
// Colabora con los DAO de clientes y materiales para devolver la misma forma que el include de Sequelize.

const CAMPOS_EDITABLES = ["descripcion", "fechaEntregaEstimada"];

export class EncargosMemoryDao {
  #encargos = [];
  #renglones = []; // { encargoId, materialId, cantidad }
  #nextId = 1;
  #clientesDao;
  #materialesDao;

  constructor({ clientesDao, materialesDao }) {
    this.#clientesDao = clientesDao;
    this.#materialesDao = materialesDao;
  }

  #buscar(id) {
    return this.#encargos.find((e) => e.id === Number(id));
  }

  #reemplazarRenglones(encargoId, materiales) {
    this.#renglones = this.#renglones.filter((r) => r.encargoId !== encargoId);
    for (const { materialId, cantidad } of materiales) {
      this.#renglones.push({ encargoId, materialId, cantidad });
    }
  }

  // Arma { ...encargo, cliente: { id, nombre }, materiales: [{ materialId, nombre, unidad, cantidad }] }.
  async #conRelaciones(encargo) {
    const cliente = await this.#clientesDao.getById(encargo.clienteId);
    const renglones = this.#renglones
      .filter((r) => r.encargoId === encargo.id)
      .sort((a, b) => a.materialId - b.materialId);
    const materiales = await Promise.all(
      renglones.map(async ({ materialId, cantidad }) => {
        const material = await this.#materialesDao.getById(materialId);
        return { materialId, nombre: material?.nombre ?? null, unidad: material?.unidad ?? null, cantidad };
      })
    );
    return {
      ...encargo,
      cliente: cliente ? { id: cliente.id, nombre: cliente.nombre } : null,
      materiales,
    };
  }

  async getAll() {
    return Promise.all(this.#encargos.map((e) => this.#conRelaciones(e)));
  }

  async getById(id) {
    const encargo = this.#buscar(id);
    return encargo ? this.#conRelaciones(encargo) : null;
  }

  async save(data) {
    const encargo = {
      id: this.#nextId++,
      clienteId: data.clienteId,
      descripcion: data.descripcion,
      estado: "presupuestado",
      fechaEntregaEstimada: data.fechaEntregaEstimada ?? null,
    };
    this.#encargos.push(encargo);
    this.#reemplazarRenglones(encargo.id, data.materiales ?? []);
    return this.#conRelaciones(encargo);
  }

  // Cambia descripción y fecha si vienen; si viene `materiales`, reemplaza la lista completa.
  async update(id, changes) {
    const encargo = this.#buscar(id);
    if (!encargo) return null;

    for (const campo of CAMPOS_EDITABLES) {
      if (campo in changes) encargo[campo] = changes[campo];
    }
    if (changes.materiales) this.#reemplazarRenglones(encargo.id, changes.materiales);
    return this.#conRelaciones(encargo);
  }

  async delete(id) {
    const index = this.#encargos.findIndex((e) => e.id === Number(id));
    if (index === -1) return false;

    const [encargo] = this.#encargos.splice(index, 1);
    this.#renglones = this.#renglones.filter((r) => r.encargoId !== encargo.id);
    return true;
  }

  // Para las reglas de baja de clientes y materiales (design D8): ¿hay algún encargo, en cualquier estado?
  async existePorCliente(clienteId) {
    return this.#encargos.some((e) => e.clienteId === Number(clienteId));
  }

  async existePorMaterial(materialId) {
    return this.#renglones.some((r) => r.materialId === Number(materialId));
  }

  // Cambia el estado y aplica los movimientos de stock en una sola operación atómica (design D4):
  // solo si el estado actual está en `desde` y todos los movimientos son posibles; si no, no cambia nada
  // y devuelve null. Entre la verificación y la escritura no hay ningún await.
  async cambiarEstado(id, { desde, hacia, movimientos = [] }) {
    const encargo = this.#buscar(id);
    if (!encargo || !desde.includes(encargo.estado)) return null;
    if (movimientos.length > 0 && !this.#materialesDao.ajustarStock(movimientos)) return null;

    encargo.estado = hacia;
    return this.#conRelaciones(encargo);
  }
}

export default EncargosMemoryDao;
