import { Route } from '@angular/router';

import { ShellComponent } from './layout/shell/shell.component';
import { AuthGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/orb-dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'management/client',
        loadComponent: () =>
          import('./features/client/client-list/client-list.component').then(
            (m) => m.ClientListComponent
          ),
      },
       {
        path: 'management/product',
        loadComponent: () =>
          import('./features/stock/product/product-list/product-list.component').then(
            (m) => m.ProductListComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
