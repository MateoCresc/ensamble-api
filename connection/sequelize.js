import { Sequelize } from "sequelize";

// Crea una conexión Sequelize a SQLite (design D1 de persistencia-materiales).
// No es un singleton: cada armado del contenedor tiene la suya. Con storage ":memory:" la base
// vive solo mientras dura la conexión (útil para tests); con una ruta, se guarda en ese archivo.
export const createSequelize = ({ storage, logging = false }) =>
  new Sequelize({
    dialect: "sqlite",
    storage,
    logging: logging ? console.log : false,
  });

export default createSequelize;
