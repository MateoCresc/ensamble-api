// Error de dominio con código, mensaje, status HTTP y detalles opcionales.
export class AppError extends Error {
  constructor(code, message, statusCode = 500, details) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export default AppError;
