import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Tooltip } from 'primeng/tooltip';
import { MaterialesApi } from '../../core/api/materiales.api';
import { Material, MaterialInput, UNIDADES, Unidad } from '../../core/modelos';
import { esStockBajo } from '../../dominio/materiales';

@Component({
  selector: 'app-materiales-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    Dialog,
    Button,
    InputText,
    InputNumber,
    Select,
    Tag,
    ToggleSwitch,
    IconField,
    InputIcon,
    Tooltip,
  ],
  templateUrl: './materiales.page.html',
})
export class MaterialesPage implements OnInit {
  private readonly api = inject(MaterialesApi);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  protected readonly unidades = UNIDADES.map((u) => ({ label: u, value: u }));
  protected readonly esStockBajo = esStockBajo;

  protected readonly materiales = signal<Material[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly dialogoVisible = signal(false);
  protected readonly editando = signal<Material | null>(null);

  protected soloBajoStock = false;
  private filtroNombre = '';
  private readonly filtro$ = new Subject<string>();

  protected readonly form = this.fb.group({
    nombre: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
    unidad: this.fb.control<Unidad | null>(null, Validators.required),
    stock: this.fb.control<number | null>(0, [Validators.required, Validators.min(0)]),
    stockMinimo: this.fb.control<number | null>(0, [Validators.required, Validators.min(0)]),
  });

  ngOnInit(): void {
    this.filtro$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((nombre) => {
        this.filtroNombre = nombre;
        this.cargar();
      });
    this.cargar();
  }

  protected filtrar(nombre: string): void {
    this.filtro$.next(nombre);
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.api
      .listar({ nombre: this.filtroNombre, bajoStock: this.soloBajoStock })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({ next: (lista) => this.materiales.set(lista), error: () => this.materiales.set([]) });
  }

  protected nuevo(): void {
    this.editando.set(null);
    this.form.reset({ nombre: '', unidad: null, stock: 0, stockMinimo: 0 });
    this.dialogoVisible.set(true);
  }

  protected editar(material: Material): void {
    this.editando.set(material);
    this.form.reset({
      nombre: material.nombre,
      unidad: material.unidad,
      stock: material.stock,
      stockMinimo: material.stockMinimo,
    });
    this.dialogoVisible.set(true);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: MaterialInput = {
      nombre: v.nombre.trim(),
      unidad: v.unidad as Unidad,
      stock: v.stock ?? 0,
      stockMinimo: v.stockMinimo ?? 0,
    };
    const actual = this.editando();
    const pedido = actual ? this.api.actualizar(actual.id, body) : this.api.crear(body);

    this.guardando.set(true);
    pedido.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: (material) => {
        this.mensajes.add({
          severity: 'success',
          summary: actual ? 'Material actualizado' : 'Material creado',
          detail: `${material.nombre} (#${material.id})`,
        });
        this.dialogoVisible.set(false);
        this.cargar();
      },
      error: () => undefined,
    });
  }

  protected eliminar(material: Material): void {
    this.confirmacion.confirm({
      header: 'Eliminar material',
      message: `¿Eliminar ${material.nombre}? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () =>
        this.api.eliminar(material.id).subscribe({
          next: () => {
            this.mensajes.add({ severity: 'success', summary: 'Material eliminado', detail: material.nombre });
            this.cargar();
          },
          error: () => undefined,
        }),
    });
  }

  protected invalido(campo: 'nombre' | 'unidad' | 'stock' | 'stockMinimo'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }
}
