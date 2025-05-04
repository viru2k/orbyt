import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const appRoutes: Routes = [
  // ---------- público ----------
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then(m => m.LoginComponent)
  },

  // ---------- área protegida ----------
  {
    path: '',
    canActivateChild: [AuthGuard],      // ← protege todos los hijos
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      // Dashboard
      {
        path: 'home',
        loadComponent: () =>
          import('./features/dashboard/orb-dashboard.component').then(m => m.DashboardComponent)
      },

      // Agenda
     /*  {
        path: 'agenda',
        loadComponent: () =>
          import('./features/agenda/agenda.component').then(m => m.AgendaComponent)
      }, */

      // Stock
      {
        path: 'stock/products',
        loadComponent: () =>
          import('./features/stock/product/products-list/products-list.component').then(m => m.ProductsListComponent)
      },
    

      // Usuarios
    /*   {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then(m => m.UsersComponent)
      }, */

      // Fallback protegido
      { path: '**', redirectTo: 'home' }
    ]
  }
];
