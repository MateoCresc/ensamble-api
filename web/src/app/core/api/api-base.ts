// Prefijo de todas las llamadas a la API (design D2). El proxy de desarrollo (web/proxy.conf.json)
// reenvía /api/** a http://localhost:3000 quitando el prefijo, para no chocar con las rutas de la UI.
export const API_BASE = '/api';

/** Arma los query params omitiendo valores vacíos (undefined, null, false o texto en blanco). */
export const queryParams = (filtros: Record<string, string | number | boolean | null | undefined>) => {
  const params: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === null || valor === false) continue;
    const texto = String(valor).trim();
    if (texto !== '') params[clave] = texto;
  }
  return params;
};
