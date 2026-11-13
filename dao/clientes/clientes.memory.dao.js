// Adaptador DAO en memoria para Clientes (design D1).
// Respeta la interfaz que va a tener el DAO Sequelize: métodos async que devuelven objetos planos
// (copias, nunca referencias al array interno) y null cuando no encuentran.

// Solo se guardan las columnas de la entidad, como haría una tabla: cualquier otro campo (incluido id) se descarta.
const aRegistro = (id, data) => ({
  id,
  nombre: data.nombre,
  email: data.email,
  telefono: data.telefono ?? null,
});

const CAMPOS_EDITABLES = ["nombre", "email", "telefono"];

const copia = (cliente) => (cliente ? { ...cliente } : null);

export class ClientesMemoryDao {
  #clientes = [];
  #nextId = 1;

  async getAll() {
    return this.#clientes.map(copia);
  }

  async getById(id) {
    return copia(this.#clientes.find((c) => c.id === Number(id)));
  }

  // Compara sin distinguir mayúsculas (spec "Email único").
  async getByEmail(email) {
    const buscado = String(email).toLowerCase();
    return copia(this.#clientes.find((c) => c.email.toLowerCase() === buscado));
  }

  async save(data) {
    const cliente = aRegistro(this.#nextId++, data);
    this.#clientes.push(cliente);
    return copia(cliente);
  }

  // Aplica solo los campos de la entidad presentes en `changes`; el id nunca se modifica.
  async update(id, changes) {
    const cliente = this.#clientes.find((c) => c.id === Number(id));
    if (!cliente) return null;

    for (const campo of CAMPOS_EDITABLES) {
      if (campo in changes) cliente[campo] = changes[campo];
    }
    return copia(cliente);
  }

  async delete(id) {
    const index = this.#clientes.findIndex((c) => c.id === Number(id));
    if (index === -1) return false;

    this.#clientes.splice(index, 1);
    return true;
  }
}

export default ClientesMemoryDao;
