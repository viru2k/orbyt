import { Route } from '@angular/router';

import { ShellComponent } from './layout/shell/shell.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

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
          import('./features/dashboard/dashboard.component').then(
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
        path: 'management/services',
        loadComponent: () =>
          import('./features/services/services-list/services-list.component').then(
            (m) => m.ServicesListComponent
          ),
      },
      {
        path: 'inventory',
        children: [
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/inventory/dashboard/inventory-dashboard/inventory-dashboard.component').then(
                (m) => m.InventoryDashboardComponent
              ),
          },
          {
            path: 'movements',
            loadComponent: () =>
              import('./features/inventory/movements/movement-list/movement-list.component').then(
                (m) => m.MovementListComponent
              ),
          },
          {
            path: 'products',
            loadComponent: () =>
              import('./features/stock/product/product-list/product-list.component').then(
                (m) => m.ProductListComponent
              ),
          },
        ]
      },
      {
        path: 'management/users', // Nueva ruta para usuarios
        canActivate: [AdminGuard],
        loadComponent: () =>
          import('./features/users/users-list/users-list.component').then(
            (m) => m.UsersListComponent
          ),
      },
      {
        path: 'management/rooms', // Nueva ruta para gestión de salas
        canActivate: [AdminGuard],
        loadComponent: () =>
          import('./features/rooms/rooms-list/rooms-list.component').then(
            (m) => m.RoomsListComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
      {
        path: 'agenda',
        loadComponent: () =>
          import('./features/agenda/agenda.component').then(
            (m) => m.AgendaComponent
          ),
      },
      {
        path: 'agenda/new',
        loadComponent: () =>
          import('./features/agenda/agenda-new/agenda-new.component').then(
            (m) => m.AgendaNewComponent
          ),
      },
      {
        path: 'agenda/config',
        loadComponent: () =>
          import('./features/agenda/agenda-config/agenda-config.component').then(
            (m) => m.AgendaConfigComponent
          ),
      },
      {
        path: 'consultations',
        loadComponent: () =>
          import('./features/consultations/consultations-list.component').then(
            (m) => m.ConsultationsListComponent
          ),
      },
      {
        path: 'consultations/tokens',
        loadComponent: () =>
          import('./features/consultation-tokens/components/token-management/token-management.component').then(
            (m) => m.TokenManagementComponent
          ),
      },
      {
        path: 'rewards',
        children: [
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/rewards/components/rewards-dashboard/rewards-dashboard.component').then(
                (m) => m.RewardsDashboardComponent
              ),
          },
          {
            path: 'management',
            loadComponent: () =>
              import('./features/rewards/components/rewards-management/rewards-management.component').then(
                (m) => m.RewardsManagementComponent
              ),
          },
          {
            path: 'client-view',
            loadComponent: () =>
              import('./features/rewards/components/client-rewards-view/client-rewards-view.component').then(
                (m) => m.ClientRewardsViewComponent
              ),
          },
        ],
      },
      {
        path: 'email',
        children: [
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/email-management/components/email-dashboard/email-dashboard.component').then(
                (m) => m.EmailDashboardComponent
              ),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./features/email-management/components/email-settings/email-settings.component').then(
                (m) => m.EmailSettingsComponent
              ),
          },
          {
            path: 'test',
            loadComponent: () =>
              import('./features/email-management/components/test-email/test-email.component').then(
                (m) => m.TestEmailComponent
              ),
          },
        ],
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/invoices-list.component').then(
            (m) => m.InvoicesListComponent
          ),
      },
    ],
  },
  // Public routes (no authentication required)
  {
    path: 'consulta/:token',
    loadComponent: () =>
      import('./features/consultation-tokens/components/public-consultation/public-consultation.component').then(
        (m) => m.PublicConsultationComponent
      ),
  },
  { path: '**', redirectTo: 'dashboard' },
];
