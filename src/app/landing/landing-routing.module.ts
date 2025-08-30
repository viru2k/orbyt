import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingLayoutComponent } from './components/layout/landing-layout.component';

const routes: Routes = [
  {
    path: '',
    component: LandingLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'precios',
        loadComponent: () => import('./pages/pricing/pricing.component').then(m => m.PricingComponent)
      },
      {
        path: 'funcionalidades',
        loadComponent: () => import('./pages/features/features.component').then(m => m.FeaturesComponent)
      },
      {
        path: 'demo',
        loadComponent: () => import('./pages/demo/demo.component').then(m => m.DemoComponent)
      },
      {
        path: 'sobre-nosotros',
        loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
      },
      {
        path: 'contacto',
        loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent)
      },
      {
        path: 'recursos',
        children: [
          {
            path: 'blog',
            loadComponent: () => import('./pages/resources/blog/blog.component').then(m => m.BlogComponent)
          },
          {
            path: 'casos-exito',
            loadComponent: () => import('./pages/resources/case-studies/case-studies.component').then(m => m.CaseStudiesComponent)
          },
          {
            path: 'webinars',
            loadComponent: () => import('./pages/resources/webinars/webinars.component').then(m => m.WebinarsComponent)
          },
          {
            path: 'guias',
            loadComponent: () => import('./pages/resources/guides/guides.component').then(m => m.GuidesComponent)
          }
        ]
      },
      {
        path: 'legal',
        children: [
          {
            path: 'privacidad',
            loadComponent: () => import('./pages/legal/privacy/privacy.component').then(m => m.PrivacyComponent)
          },
          {
            path: 'terminos',
            loadComponent: () => import('./pages/legal/terms/terms.component').then(m => m.TermsComponent)
          },
          {
            path: 'cookies',
            loadComponent: () => import('./pages/legal/cookies/cookies.component').then(m => m.CookiesComponent)
          }
        ]
      }
    ]
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-routing.module').then(m => m.AuthRoutingModule)
  },
  {
    path: 'checkout',
    loadChildren: () => import('./checkout/checkout-routing.module').then(m => m.CheckoutRoutingModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandingRoutingModule { }