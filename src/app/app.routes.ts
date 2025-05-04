import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard'; // ajusta la ruta según tu estructura


export const appRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: 'home', loadComponent: () => import('./features/dashboard/orb-dashboard.component').then(m => m.DashboardComponent) },
/*       { path: 'agenda', loadComponent: () => import('./features/agenda/agenda.component').then(m => m.AgendaComponent) },
      { path: 'stock', loadComponent: () => import('./features/stock/stock.component').then(m => m.StockComponent) },
      { path: 'users', loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) }, */
      { path: '**', redirectTo: 'home' }
    ]
  }
];
