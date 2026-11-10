import { AppError } from "../errors/AppError.js";

const TARGETS = ["body", "params", "query"];

// validate(schema, target): valida req[target] con un schema de Zod y lo reemplaza por el dato parseado.
export const validate = (schema, target = "body") => {
  if (!TARGETS.includes(target)) {
    throw new Error(`validate: target inválido "${target}". Usar: ${TARGETS.join(", ")}`);
  }

  return (req, res, next) => {
    const result = schema.safeParse(req[target] ?? {});

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.join(".") : target,
        message: issue.message,
      }));
      return next(new AppError("VALIDATION_ERROR", "Los datos enviados no son válidos", 400, details));
    }

    // En Express 5 req.query es un getter: se redefine para poder reemplazarlo.
    Object.defineProperty(req, target, {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    return next();
  };
};

export default validate;
