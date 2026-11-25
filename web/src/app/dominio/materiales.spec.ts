import { Material } from '../core/modelos';
import { esStockBajo } from './materiales';

const material = (stock: number, stockMinimo: number): Material => ({
  id: 1,
  nombre: 'Tablón de pino',
  unidad: 'unidad',
  stock,
  stockMinimo,
});

describe('esStockBajo', () => {
  it('Material en el mínimo: stock 5 y mínimo 5 es stock bajo', () => {
    expect(esStockBajo(material(5, 5))).toBe(true);
  });

  it('Material con stock suficiente: stock 6 y mínimo 5 no es stock bajo', () => {
    expect(esStockBajo(material(6, 5))).toBe(false);
  });

  it('stock por debajo del mínimo es stock bajo', () => {
    expect(esStockBajo(material(2.5, 3))).toBe(true);
  });
});
