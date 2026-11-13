// Controlador de Clientes (design D5): solo traduce HTTP ↔ casos de uso.
// No conoce DAOs ni reglas; los errores de dominio (404, 409) los lanzan los casos de uso
// y Express 5 los propaga solo al errorHandler.
export const makeClientesController = (useCases) => ({
  // GET /clientes
  listar: async (req, res) => {
    res.status(200).json(await useCases.listarClientes(req.query));
  },

  // GET /clientes/:id
  obtener: async (req, res) => {
    res.status(200).json(await useCases.obtenerCliente(req.params.id));
  },

  // POST /clientes → 201 + Location del recurso creado
  crear: async (req, res) => {
    const cliente = await useCases.crearCliente(req.body);
    res.status(201).location(`/clientes/${cliente.id}`).json(cliente);
  },

  // PUT /clientes/:id (actualización parcial)
  actualizar: async (req, res) => {
    res.status(200).json(await useCases.actualizarCliente(req.params.id, req.body));
  },

  // DELETE /clientes/:id → 204 sin cuerpo
  eliminar: async (req, res) => {
    await useCases.eliminarCliente(req.params.id);
    res.status(204).end();
  },
});

export default makeClientesController;
