// Controlador de Materiales: solo traduce HTTP ↔ casos de uso (mismo patrón que clientes).
export const makeMaterialesController = (useCases) => ({
  // GET /materiales
  listar: async (req, res) => {
    res.status(200).json(await useCases.listarMateriales(req.query));
  },

  // GET /materiales/:id
  obtener: async (req, res) => {
    res.status(200).json(await useCases.obtenerMaterial(req.params.id));
  },

  // POST /materiales → 201 + Location
  crear: async (req, res) => {
    const material = await useCases.crearMaterial(req.body);
    res.status(201).location(`/materiales/${material.id}`).json(material);
  },

  // PUT /materiales/:id (actualización parcial)
  actualizar: async (req, res) => {
    res.status(200).json(await useCases.actualizarMaterial(req.params.id, req.body));
  },

  // DELETE /materiales/:id → 204
  eliminar: async (req, res) => {
    await useCases.eliminarMaterial(req.params.id);
    res.status(204).end();
  },
});

export default makeMaterialesController;
