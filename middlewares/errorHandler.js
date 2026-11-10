import { AppError } from "../errors/AppError.js";

const buildBody = (code, message, details) => {
  const error = { code, message };
  if (details !== undefined) {
    error.details = details;
  }
  return { error };
};

// Middleware final de errores: traduce cualquier error al formato { error: { code, message, details? } }.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(buildBody(err.code, err.message, err.details));
  }

  if (err?.type === "entity.parse.failed") {
    return res
      .status(400)
      .json(buildBody("INVALID_JSON", "El cuerpo de la petición no es un JSON válido"));
  }

  console.error(err);
  return res
    .status(500)
    .json(buildBody("INTERNAL_ERROR", "Ocurrió un error inesperado en el servidor"));
};

export default errorHandler;
