import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { HealthApi } from '../core/api/health.api';

type EstadoApi = 'verificando' | 'disponible' | 'caida';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Menubar, Tag, Toast, ConfirmDialog],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout implements OnInit {
  private readonly health = inject(HealthApi);

  protected readonly secciones: MenuItem[] = [
    { label: 'Encargos', icon: 'pi pi-briefcase', routerLink: '/encargos' },
    { label: 'Clientes', icon: 'pi pi-users', routerLink: '/clientes' },
    { label: 'Materiales', icon: 'pi pi-box', routerLink: '/materiales' },
  ];

  protected readonly estadoApi = signal<EstadoApi>('verificando');

  ngOnInit(): void {
    this.verificarApi();
  }

  protected verificarApi(): void {
    this.estadoApi.set('verificando');
    this.health.estaDisponible().subscribe((ok) => this.estadoApi.set(ok ? 'disponible' : 'caida'));
  }
}
