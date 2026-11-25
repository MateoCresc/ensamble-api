import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'encargos' },
  {
    path: 'clientes',
    title: 'Clientes · Ensamble',
    loadComponent: () => import('./features/clientes/clientes.page').then((m) => m.ClientesPage),
  },
  {
    path: 'materiales',
    title: 'Materiales · Ensamble',
    loadComponent: () => import('./features/materiales/materiales.page').then((m) => m.MaterialesPage),
  },
  {
    path: 'encargos',
    title: 'Encargos · Ensamble',
    loadComponent: () => import('./features/encargos/encargos.page').then((m) => m.EncargosPage),
  },
  { path: '**', redirectTo: 'encargos' },
];
