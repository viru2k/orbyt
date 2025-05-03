import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard'; // ajusta la ruta según tu estructura


export const appRoutes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/login/login.component').then((m) => m.LoginComponent)
      },
    
    ] 
  },
  

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login'
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];