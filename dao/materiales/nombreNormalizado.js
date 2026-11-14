// Clave de unicidad del nombre de un material (design D5 de persistencia-materiales):
// sin espacios en los extremos y en minúsculas. Se calcula en JavaScript porque lower() de SQLite
// no pasa a minúsculas letras acentuadas (Ó, Ñ). La usan ambos DAO.
export const nombreNormalizado = (nombre) => String(nombre).trim().toLowerCase();

export default nombreNormalizado;
