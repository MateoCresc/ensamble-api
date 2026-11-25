// Notificador por consola. Contrato común de todos los notificadores: notificar({ asunto, mensaje }).
export const consoleNotifier = {
  async notificar({ asunto, mensaje }) {
    console.log(`[NOTIFICACIÓN] ${asunto} — ${mensaje}`);
  },
};

export default consoleNotifier;
