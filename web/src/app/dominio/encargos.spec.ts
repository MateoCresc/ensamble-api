import { EstadoEncargo } from '../core/modelos';
import {
  accionesDisponibles,
  armarBodyEncargo,
  esEditable,
  esEliminable,
  severidadEstado,
  tieneMaterialesRepetidos,
} from './encargos';

describe('accionesDisponibles', () => {
  it('Acciones de un presupuestado: Confirmar y Cancelar', () => {
    expect(accionesDisponibles('presupuestado')).toEqual(['confirmar', 'cancelar']);
  });

  it('confirmado: Iniciar y Cancelar', () => {
    expect(accionesDisponibles('confirmado')).toEqual(['iniciar', 'cancelar']);
  });

  it('en_produccion: Entregar', () => {
    expect(accionesDisponibles('en_produccion')).toEqual(['entregar']);
  });

  it('Acciones de un entregado: ninguna acción de ciclo de vida', () => {
    expect(accionesDisponibles('entregado')).toEqual([]);
  });

  it('cancelado: ninguna acción de ciclo de vida', () => {
    expect(accionesDisponibles('cancelado')).toEqual([]);
  });
});

describe('esEditable', () => {
  it('Acciones de un presupuestado: se ofrece Editar', () => {
    expect(esEditable('presupuestado')).toBe(true);
  });

  it.each<EstadoEncargo>(['confirmado', 'en_produccion', 'entregado', 'cancelado'])(
    'Encargo no presupuestado: un encargo %s no se puede editar',
    (estado) => {
      expect(esEditable(estado)).toBe(false);
    },
  );
});

describe('esEliminable', () => {
  it.each<EstadoEncargo>(['presupuestado', 'cancelado'])('se ofrece Eliminar en %s', (estado) => {
    expect(esEliminable(estado)).toBe(true);
  });

  it.each<EstadoEncargo>(['confirmado', 'en_produccion', 'entregado'])(
    'no se ofrece Eliminar en %s (Acciones de un entregado)',
    (estado) => {
      expect(esEliminable(estado)).toBe(false);
    },
  );
});

describe('severidadEstado', () => {
  it('asigna una severidad distinta a cada estado', () => {
    const estados: EstadoEncargo[] = ['presupuestado', 'confirmado', 'en_produccion', 'entregado', 'cancelado'];
    const severidades = estados.map(severidadEstado);
    expect(new Set(severidades).size).toBe(estados.length);
  });
});

describe('tieneMaterialesRepetidos', () => {
  it('Material repetido en el formulario: detecta el mismo material en dos renglones', () => {
    expect(
      tieneMaterialesRepetidos([
        { materialId: 1, cantidad: 2 },
        { materialId: 1, cantidad: 3 },
      ]),
    ).toBe(true);
  });

  it('materiales distintos o renglones sin elegir no cuentan como repetidos', () => {
    expect(
      tieneMaterialesRepetidos([
        { materialId: 1, cantidad: 2 },
        { materialId: 2, cantidad: 3 },
        { materialId: null, cantidad: 1 },
        { materialId: null, cantidad: 1 },
      ]),
    ).toBe(false);
  });
});

describe('armarBodyEncargo', () => {
  const formulario = {
    clienteId: 4,
    descripcion: '  Mesa de comedor  ',
    fechaEntregaEstimada: new Date(2026, 11, 5), // 5 de diciembre de 2026, hora local
    materiales: [
      { materialId: 1, cantidad: 4.5 },
      { materialId: 2, cantidad: 2 },
    ],
  };

  it('Alta con materiales: arma clienteId, descripción, fecha AAAA-MM-DD y renglones { materialId, cantidad }', () => {
    expect(armarBodyEncargo(formulario, { edicion: false })).toEqual({
      clienteId: 4,
      descripcion: 'Mesa de comedor',
      fechaEntregaEstimada: '2026-12-05',
      materiales: [
        { materialId: 1, cantidad: 4.5 },
        { materialId: 2, cantidad: 2 },
      ],
    });
  });

  it('Alta con materiales: sin fecha envía fechaEntregaEstimada null', () => {
    const body = armarBodyEncargo({ ...formulario, fechaEntregaEstimada: null }, { edicion: false });
    expect(body.fechaEntregaEstimada).toBeNull();
  });

  it('completa con ceros mes y día de un solo dígito', () => {
    const body = armarBodyEncargo({ ...formulario, fechaEntregaEstimada: new Date(2027, 0, 9) }, { edicion: false });
    expect(body.fechaEntregaEstimada).toBe('2027-01-09');
  });

  it('descarta renglones sin material elegido', () => {
    const body = armarBodyEncargo(
      { ...formulario, materiales: [{ materialId: 1, cantidad: 1 }, { materialId: null, cantidad: 3 }] },
      { edicion: false },
    );
    expect(body.materiales).toEqual([{ materialId: 1, cantidad: 1 }]);
  });

  it('al editar no envía clienteId', () => {
    const body = armarBodyEncargo(formulario, { edicion: true });
    expect(body).not.toHaveProperty('clienteId');
    expect(body).toEqual({
      descripcion: 'Mesa de comedor',
      fechaEntregaEstimada: '2026-12-05',
      materiales: [
        { materialId: 1, cantidad: 4.5 },
        { materialId: 2, cantidad: 2 },
      ],
    });
  });
});
