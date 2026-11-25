import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Tooltip } from 'primeng/tooltip';
import { ClientesApi } from '../../core/api/clientes.api';
import { Cliente, ClienteInput } from '../../core/modelos';

const TELEFONO = /^[0-9+\-\s]{6,20}$/;

@Component({
  selector: 'app-clientes-page',
  imports: [ReactiveFormsModule, TableModule, Dialog, Button, InputText, IconField, InputIcon, Tooltip],
  templateUrl: './clientes.page.html',
})
export class ClientesPage implements OnInit {
  private readonly api = inject(ClientesApi);
  private readonly mensajes = inject(MessageService);
  private readonly confirmacion = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly dialogoVisible = signal(false);
  protected readonly editando = signal<Cliente | null>(null);

  private filtroNombre = '';
  private readonly filtro$ = new Subject<string>();

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.pattern(TELEFONO)]],
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
      .listar({ nombre: this.filtroNombre })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({ next: (lista) => this.clientes.set(lista), error: () => this.clientes.set([]) });
  }

  protected nuevo(): void {
    this.editando.set(null);
    this.form.reset({ nombre: '', email: '', telefono: '' });
    this.dialogoVisible.set(true);
  }

  protected editar(cliente: Cliente): void {
    this.editando.set(cliente);
    this.form.reset({ nombre: cliente.nombre, email: cliente.email, telefono: cliente.telefono ?? '' });
    this.dialogoVisible.set(true);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const body: ClienteInput = {
      nombre: valores.nombre.trim(),
      email: valores.email.trim(),
      telefono: valores.telefono.trim() === '' ? null : valores.telefono.trim(),
    };
    const actual = this.editando();
    const pedido = actual ? this.api.actualizar(actual.id, body) : this.api.crear(body);

    this.guardando.set(true);
    pedido.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: (cliente) => {
        this.mensajes.add({
          severity: 'success',
          summary: actual ? 'Cliente actualizado' : 'Cliente creado',
          detail: `${cliente.nombre} (#${cliente.id})`,
        });
        this.dialogoVisible.set(false);
        this.cargar();
      },
      // El error ya se mostró en el interceptor; el diálogo queda abierto con los datos cargados.
      error: () => undefined,
    });
  }

  protected eliminar(cliente: Cliente): void {
    this.confirmacion.confirm({
      header: 'Eliminar cliente',
      message: `¿Eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () =>
        this.api.eliminar(cliente.id).subscribe({
          next: () => {
            this.mensajes.add({ severity: 'success', summary: 'Cliente eliminado', detail: cliente.nombre });
            this.cargar();
          },
          error: () => undefined,
        }),
    });
  }

  protected invalido(campo: 'nombre' | 'email' | 'telefono'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }
}
