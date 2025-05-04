import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'home', loadComponent: () => import('./features/dashboard/orb-dashboard.component').then(m => m.DashboardComponent) },
      {
        path: 'stock',
        children: [
          { path: 'products', loadComponent: () => import('./features/stock/product/products-list/products-list.component').then(m => m.ProductsListComponent) }
        ]
      },
      // Agrega rutas para agenda y users si es necesario
      { path: '**', redirectTo: 'home' }
    ]
  }
];
