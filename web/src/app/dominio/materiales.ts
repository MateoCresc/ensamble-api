import { Material } from '../core/modelos';

/** Spec "Marca de stock bajo": stock menor o igual al stock mínimo (mismo criterio que la API). */
export const esStockBajo = (material: Material): boolean => material.stock <= material.stockMinimo;
