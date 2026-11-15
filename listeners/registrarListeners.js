import { EVENTOS } from "../events/eventNames.js";

// Módulo de avisos: decide qué hacer cuando ocurre un hecho del dominio (consigna 2.6, design D6).
// No conoce a quien emite (casos de uso) ni el canal concreto (los notificadores se inyectan).

// Cada listener captura sus propios errores: una falla del canal no debe afectar la operación
// que emitió el evento (y un rechazo sin capturar en un listener async tumbaría el proceso).
const escuchar = (bus, evento, notificador, armarAviso) => {
  bus.on(evento, async (datos) => {
    try {
      await notificador.notificar(armarAviso(datos));
    } catch (error) {
      console.error(`[notificaciones] No se pudo notificar "${evento}":`, error.message);
    }
  });
};

export const registrarListeners = (bus, notificadores) => {
  escuchar(bus, EVENTOS.ENCARGO_CONFIRMADO, notificadores.encargos, ({ encargoId, cliente, cantidadMateriales }) => ({
    asunto: "Encargo confirmado",
    mensaje: `Encargo #${encargoId} de ${cliente.nombre} confirmado (${cantidadMateriales} ${cantidadMateriales === 1 ? "material" : "materiales"})`,
  }));

  escuchar(bus, EVENTOS.MATERIAL_STOCK_BAJO, notificadores.stock, ({ nombre, stock, unidad, stockMinimo }) => ({
    asunto: "Stock bajo",
    mensaje: `${nombre}: quedan ${stock} ${unidad} (mínimo ${stockMinimo})`,
  }));
};

export default registrarListeners;
