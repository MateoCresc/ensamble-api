// Controlador de Encargos: traduce HTTP ↔ casos de uso. Las acciones del ciclo de vida
// (confirmar, cancelar, iniciar, entregar) modifican un recurso existente: responden 200 con el encargo.
export const makeEncargosController = (useCases) => ({
  listar: async (req, res) => {
    res.status(200).json(await useCases.listarEncargos(req.query));
  },

  obtener: async (req, res) => {
    res.status(200).json(await useCases.obtenerEncargo(req.params.id));
  },

  crear: async (req, res) => {
    const encargo = await useCases.crearEncargo(req.body);
    res.status(201).location(`/encargos/${encargo.id}`).json(encargo);
  },

  actualizar: async (req, res) => {
    res.status(200).json(await useCases.actualizarEncargo(req.params.id, req.body));
  },

  eliminar: async (req, res) => {
    await useCases.eliminarEncargo(req.params.id);
    res.status(204).end();
  },

  confirmar: async (req, res) => {
    res.status(200).json(await useCases.confirmarEncargo(req.params.id));
  },

  cancelar: async (req, res) => {
    res.status(200).json(await useCases.cancelarEncargo(req.params.id));
  },

  iniciar: async (req, res) => {
    res.status(200).json(await useCases.iniciarEncargo(req.params.id));
  },

  entregar: async (req, res) => {
    res.status(200).json(await useCases.entregarEncargo(req.params.id));
  },
});

export default makeEncargosController;
