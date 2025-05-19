// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard'; // Asumo que este guard está correcto y funcionando

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
          { path: 'products', loadComponent: () => import('./features/stock/product/product-list/product-list.component').then(m => m.ProductListComponent) }
        ]
      },
      {
        path: 'client', 
        children: [
          { path: 'list', loadComponent: () => import('./features/client/client-list/client-list.component').then(m => m.ClientListComponent) }
        ]
      },
  
      // ... otras rutas ...
      { path: '', redirectTo: 'home', pathMatch: 'full' }, // Redirección por defecto dentro del shell
      { path: '**', redirectTo: 'home' } // Wildcard dentro del shell
    ]
  }

];