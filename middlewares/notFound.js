import { AppError } from "../errors/AppError.js";

// Captura cualquier combinación de método y ruta no definida.
export const notFound = (req, res, next) => {
  next(new AppError("NOT_FOUND", `Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
};

export default notFound;
