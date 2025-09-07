import { Route } from '@angular/router';

export const legalRoutes: Route[] = [
  {
    path: 'terms',
    loadComponent: () => import('./terms/terms.component').then(m => m.TermsComponent)
  },
  {
    path: 'privacy',
    loadComponent: () => import('./privacy/privacy.component').then(m => m.PrivacyComponent)
  },
  {
    path: 'cookies',
    loadComponent: () => import('./cookies/cookies.component').then(m => m.CookiesComponent)
  },
  {
    path: '',
    redirectTo: 'terms',
    pathMatch: 'full'
  }
];