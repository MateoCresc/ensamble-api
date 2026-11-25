import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Tag } from 'primeng/tag';
import { Tooltip } from 'primeng/tooltip';
import { ClientesApi } from '../../core/api/clientes.api';
import { EncargosApi } from '../../core/api/encargos.api';
import { MaterialesApi } from '../../core/api/materiales.api';
import { Cliente, ESTADOS_ENCARGO, Encargo, EstadoEncargo, Material } from '../../core/modelos';
import {
  AccionCiclo,
  ETIQUETA_ACCION,
  ETIQUETA_ESTADO,
  RenglonFormulario,
  accionesDisponibles,
  armarBodyEncargo,
  esEditable,
  esEliminable,
  severidadEstado,
  tieneMaterialesRepetidos,
} from '../../dominio/encargos';

type RenglonForm = FormGroup<{
  materialId: FormControl<number | null>;
  cantidad: FormControl<number | null>;
}>;

const sinMaterialesRepetidos = (control: AbstractControl): ValidationErrors | null =>
  tieneMaterialesRepetidos(control.value as RenglonFormulario[]) ? { materialRepetido: true } : null;

@Component({
  selector: 'app-encargos-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Dialog,
    Button,
    InputText,
    InputNumber,
    Select,
    DatePicker,
    Tag,
    Tooltip,
  ],
  templateUrl: './encargos.page.html',
  styleUrl: './encargos.page.scss',
})
export class EncargosPage implements OnInit {
  private readonly api = inject(EncargosApi);
  private readonly clientesApi = inject(ClientesApi);
  private readonly materialesApi = inject(MaterialesApi);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  protected readonly accionesDisponibles = accionesDisponibles;
  protected readonly esEditable = esEditable;
  protected readonly esEliminable = esEliminable;
  protected readonly severidadEstado = severidadEstado;
  protected readonly etiquetaAccion = ETIQUETA_ACCION;
  protected readonly etiquetaDe = (estado: EstadoEncargo): string => ETIQUETA_ESTADO[estado];
  protected readonly estados = ESTADOS_ENCARGO.map((e) => ({ label: ETIQUETA_ESTADO[e], value: e }));

  protected readonly encargos = signal<Encargo[]>([]);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly materiales = signal<Material[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly ejecutando = signal<number | null>(null);
  protected readonly dialogoVisible = signal(false);
  protected readonly editando = signal<Encargo | null>(null);

  protected readonly opcionesCliente = computed(() =>
    this.clientes().map((c) => ({ label: `${c.nombre} (#${c.id})`, value: c.id })),
  );

  protected filtroEstado: EstadoEncargo | null = null;
  protected filtroCliente: number | null = null;

  protected readonly form = this.fb.group({
    clienteId: this.fb.control<number | null>(null, Validators.required),
    descripcion: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(500),
    ]),
    fechaEntregaEstimada: this.fb.control<Date | null>(null),
    materiales: this.fb.array<RenglonForm>([], { validators: sinMaterialesRepetidos }),
  });

  protected get renglones(): FormArray<RenglonForm> {
    return this.form.controls.materiales;
  }

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargar();
  }

  private cargarCatalogos(): void {
    this.clientesApi.listar().subscribe({ next: (l) => this.clientes.set(l), error: () => undefined });
    this.materialesApi.listar().subscribe({ next: (l) => this.materiales.set(l), error: () => undefined });
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.api
      .listar({ estado: this.filtroEstado, clienteId: this.filtroCliente })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({ next: (lista) => this.encargos.set(lista), error: () => this.encargos.set([]) });
  }

  // ---- formulario ----

  private nuevoRenglon(materialId: number | null = null, cantidad: number | null = null): RenglonForm {
    return this.fb.group({
      materialId: this.fb.control<number | null>(materialId, Validators.required),
      cantidad: this.fb.control<number | null>(cantidad, [Validators.required, Validators.min(0.01)]),
    });
  }

  /** Materiales que se pueden elegir en el renglón i: el propio y los que no eligió otro renglón. */
  protected opcionesMaterial(i: number): { label: string; value: number }[] {
    const elegidosEnOtros = new Set(
      this.renglones.controls.filter((_, j) => j !== i).map((r) => r.controls.materialId.value),
    );
    return this.materiales()
      .filter((m) => !elegidosEnOtros.has(m.id))
      .map((m) => ({ label: `${m.nombre} (${m.unidad}) · stock ${m.stock}`, value: m.id }));
  }

  protected puedeAgregarRenglon(): boolean {
    return this.renglones.length < this.materiales().length;
  }

  protected agregarRenglon(): void {
    if (this.puedeAgregarRenglon()) this.renglones.push(this.nuevoRenglon());
  }

  protected quitarRenglon(i: number): void {
    this.renglones.removeAt(i);
  }

  private abrirDialogo(encargo: Encargo | null): void {
    this.editando.set(encargo);
    // Primero el reset y después los renglones: reset() sin `materiales` dejaría los renglones en null.
    this.renglones.clear();
    this.form.reset({
      clienteId: encargo?.clienteId ?? null,
      descripcion: encargo?.descripcion ?? '',
      fechaEntregaEstimada: encargo?.fechaEntregaEstimada ? this.aFechaLocal(encargo.fechaEntregaEstimada) : null,
    });
    for (const r of encargo?.materiales ?? []) this.renglones.push(this.nuevoRenglon(r.materialId, r.cantidad));
    if (encargo) this.form.controls.clienteId.disable();
    else this.form.controls.clienteId.enable();
    // Catálogos frescos: el stock cambia al confirmar/cancelar.
    this.cargarCatalogos();
    this.dialogoVisible.set(true);
  }

  protected nuevo(): void {
    this.abrirDialogo(null);
  }

  protected editar(encargo: Encargo): void {
    this.abrirDialogo(encargo);
  }

  private aFechaLocal(iso: string): Date {
    const [a, m, d] = iso.split('-').map(Number);
    return new Date(a, m - 1, d);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const actual = this.editando();
    const pedido = actual
      ? this.api.actualizar(actual.id, armarBodyEncargo(valores, { edicion: true }))
      : this.api.crear(armarBodyEncargo(valores, { edicion: false }));

    this.guardando.set(true);
    pedido.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: (encargo) => {
        this.mensajes.add({
          severity: 'success',
          summary: actual ? 'Encargo actualizado' : 'Encargo creado',
          detail: `#${encargo.id} · ${encargo.descripcion}`,
        });
        this.dialogoVisible.set(false);
        this.cargar();
      },
      error: () => undefined,
    });
  }

  protected invalido(campo: 'clienteId' | 'descripcion'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }

  protected renglonInvalido(i: number, campo: 'materialId' | 'cantidad'): boolean {
    const control = this.renglones.at(i).controls[campo];
    return control.invalid && control.touched;
  }

  // ---- ciclo de vida ----

  protected accion(encargo: Encargo, accion: AccionCiclo): void {
    if (accion === 'cancelar') {
      this.confirmacion.confirm({
        header: 'Cancelar encargo',
        message:
          encargo.estado === 'confirmado'
            ? `¿Cancelar el encargo #${encargo.id}? Se repone el stock de sus materiales.`
            : `¿Cancelar el encargo #${encargo.id}?`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Cancelar encargo',
        rejectLabel: 'Volver',
        acceptButtonProps: { severity: 'danger' },
        rejectButtonProps: { severity: 'secondary', outlined: true },
        accept: () => this.ejecutar(encargo, accion),
      });
      return;
    }
    this.ejecutar(encargo, accion);
  }

  private ejecutar(encargo: Encargo, accion: AccionCiclo): void {
    this.ejecutando.set(encargo.id);
    this.api
      .ejecutar(encargo.id, accion)
      .pipe(finalize(() => this.ejecutando.set(null)))
      .subscribe({
        next: (actualizado) => {
          this.mensajes.add({
            severity: 'success',
            summary: `Encargo #${actualizado.id}: ${ETIQUETA_ESTADO[actualizado.estado].toLowerCase()}`,
            detail: actualizado.descripcion,
          });
          this.cargar();
        },
        error: () => undefined,
      });
  }

  protected eliminar(encargo: Encargo): void {
    this.confirmacion.confirm({
      header: 'Eliminar encargo',
      message: `¿Eliminar el encargo #${encargo.id} (${encargo.descripcion})? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () =>
        this.api.eliminar(encargo.id).subscribe({
          next: () => {
            this.mensajes.add({ severity: 'success', summary: 'Encargo eliminado', detail: `#${encargo.id}` });
            this.cargar();
          },
          error: () => undefined,
        }),
    });
  }

  protected resumenMateriales(encargo: Encargo): string {
    return encargo.materiales.map((m) => `${m.nombre} × ${m.cantidad} ${m.unidad}`).join(', ') || '—';
  }

  protected fechaLegible(iso: string | null): string {
    if (!iso) return '—';
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }
}
