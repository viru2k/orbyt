import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, state, style, transition, animate, stagger, query } from '@angular/animations';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  isPopular: boolean;
  features: string[];
  limits: {
    clients: string;
    invoices: string;
    users: string;
    storage: string;
  };
  ctaText: string;
  ctaLink: string;
}

@Component({
  selector: 'app-pricing-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="pricing-preview-section">
      <div class="container">
        <!-- Section Header -->
        <div class="section-header" [@fadeInUp]>
          <h2 class="section-title">
            Precios <span class="highlight">transparentes</span> 
            para cada etapa de tu negocio
          </h2>
          <p class="section-subtitle">
            Sin costos ocultos, sin compromisos a largo plazo. 
            Comienza gratis y escala cuando estés listo.
          </p>
        </div>

        <!-- Billing Toggle -->
        <div class="billing-toggle" [@fadeInUp]>
          <div class="toggle-container">
            <span class="toggle-label" [class.active]="!isYearly">Mensual</span>
            <button class="toggle-switch" 
                    [class.yearly]="isYearly" 
                    (click)="toggleBilling()">
              <div class="toggle-slider"></div>
            </button>
            <span class="toggle-label" [class.active]="isYearly">
              Anual
              <span class="discount-badge">-17%</span>
            </span>
          </div>
        </div>

        <!-- Pricing Cards -->
        <div class="pricing-grid" [@staggerCards]>
          <div class="pricing-card" 
               *ngFor="let plan of plans; trackBy: trackByPlan"
               [@slideInUp]
               [class.popular]="plan.isPopular">
            
            <div class="popular-badge" *ngIf="plan.isPopular">
              <i class="pi pi-star"></i>
              Más Popular
            </div>
            
            <div class="plan-header">
              <h3 class="plan-name">{{ plan.name }}</h3>
              <div class="plan-price">
                <span class="currency">€</span>
                <span class="amount">{{ getCurrentPrice(plan) }}</span>
                <span class="period">/{{ isYearly ? 'año' : 'mes' }}</span>
              </div>
              <div class="savings" *ngIf="isYearly && plan.price !== plan.yearlyPrice">
                Ahorras €{{ getSavings(plan) }} al año
              </div>
              <p class="plan-description">{{ plan.description }}</p>
            </div>

            <div class="plan-features">
              <div class="limits-section">
                <div class="limit-item">
                  <i class="pi pi-users"></i>
                  <span>{{ plan.limits.clients }} clientes</span>
                </div>
                <div class="limit-item">
                  <i class="pi pi-file"></i>
                  <span>{{ plan.limits.invoices }} facturas</span>
                </div>
                <div class="limit-item">
                  <i class="pi pi-user"></i>
                  <span>{{ plan.limits.users }} usuario{{ plan.limits.users !== '1' ? 's' : '' }}</span>
                </div>
                <div class="limit-item">
                  <i class="pi pi-database"></i>
                  <span>{{ plan.limits.storage }} almacenamiento</span>
                </div>
              </div>

              <ul class="features-list">
                <li *ngFor="let feature of plan.features" class="feature-item">
                  <i class="pi pi-check"></i>
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>

            <div class="plan-footer">
              <a [routerLink]="plan.ctaLink" 
                 class="btn"
                 [class.btn-primary]="plan.isPopular"
                 [class.btn-outline]="!plan.isPopular">
                <i class="pi pi-play-circle" *ngIf="plan.ctaText.includes('Prueba')"></i>
                <i class="pi pi-arrow-right" *ngIf="!plan.ctaText.includes('Prueba')"></i>
                {{ plan.ctaText }}
              </a>
            </div>
          </div>
        </div>

        <!-- Pricing Features Comparison -->
        <div class="comparison-teaser" [@fadeInUp]>
          <div class="teaser-content">
            <h3>¿Necesitas comparar características?</h3>
            <p>Ve la comparación completa de todos los planes y encuentra el perfecto para tu negocio.</p>
          </div>
          <div class="teaser-action">
            <a routerLink="/precios" class="btn btn-outline btn-lg">
              <i class="pi pi-list"></i>
              Comparar Todos los Planes
            </a>
          </div>
        </div>

        <!-- Trust Indicators -->
        <div class="pricing-trust" [@fadeInUp]>
          <div class="trust-items">
            <div class="trust-item">
              <i class="pi pi-shield"></i>
              <div class="trust-content">
                <h4>Prueba sin riesgo</h4>
                <p>14 días gratis, sin tarjeta de crédito</p>
              </div>
            </div>
            <div class="trust-item">
              <i class="pi pi-sync"></i>
              <div class="trust-content">
                <h4>Cambia cuando quieras</h4>
                <p>Upgrade o downgrade en cualquier momento</p>
              </div>
            </div>
            <div class="trust-item">
              <i class="pi pi-times-circle"></i>
              <div class="trust-content">
                <h4>Cancela fácilmente</h4>
                <p>Sin penalizaciones ni compromisos</p>
              </div>
            </div>
            <div class="trust-item">
              <i class="pi pi-headphones"></i>
              <div class="trust-content">
                <h4>Soporte incluido</h4>
                <p>Help desk en español 24/7</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Money Back Guarantee -->
        <div class="guarantee-section" [@fadeInUp]>
          <div class="guarantee-content">
            <div class="guarantee-icon">
              <i class="pi pi-verified"></i>
            </div>
            <div class="guarantee-text">
              <h3>Garantía de 30 días</h3>
              <p>
                Si Orbyt no mejora la eficiencia de tu negocio en los primeros 30 días, 
                te devolvemos el 100% de tu dinero. Sin preguntas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./pricing-preview.component.scss'],
  animations: [
    trigger('fadeInUp', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(30px)'
      })),
      transition('void => *', [
        animate('600ms ease-out')
      ])
    ]),
    trigger('slideInUp', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(40px)'
      })),
      transition('void => *', [
        animate('500ms ease-out')
      ])
    ]),
    trigger('staggerCards', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(40px)' }),
          stagger(200, [
            animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class PricingPreviewComponent implements OnInit {

  isYearly = false;

  plans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      yearlyPrice: 290,
      description: 'Perfecto para freelancers y consultores individuales',
      isPopular: false,
      features: [
        'Agenda básica con recordatorios SMS',
        'Facturación automática',
        'Reportes mensuales',
        'App móvil incluida',
        'Soporte por email'
      ],
      limits: {
        clients: '100',
        invoices: '50/mes',
        users: '1',
        storage: '1GB'
      },
      ctaText: 'Prueba Gratis',
      ctaLink: '/auth/registro?plan=starter'
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 59,
      yearlyPrice: 590,
      description: 'Ideal para pequeñas clínicas y empresas en crecimiento',
      isPopular: true,
      features: [
        'Todo lo de Starter, más:',
        'Agenda avanzada con recursos',
        'Facturación ilimitada',
        'Analytics avanzados',
        'Integraciones API',
        'Soporte prioritario (chat + teléfono)'
      ],
      limits: {
        clients: '500',
        invoices: 'Ilimitadas',
        users: '5',
        storage: '10GB'
      },
      ctaText: 'Prueba Gratis',
      ctaLink: '/auth/registro?plan=professional'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      yearlyPrice: 990,
      description: 'Para empresas establecidas que requieren personalización',
      isPopular: false,
      features: [
        'Todo lo de Professional, más:',
        'Usuarios ilimitados',
        'Workflow automation',
        'Multi-tenant y marca blanca',
        'Integraciones personalizadas',
        'Manager dedicado de cuenta'
      ],
      limits: {
        clients: 'Ilimitados',
        invoices: 'Ilimitadas',
        users: 'Ilimitados',
        storage: '100GB'
      },
      ctaText: 'Contactar Ventas',
      ctaLink: '/contacto?plan=enterprise'
    }
  ];

  ngOnInit(): void {
    // Component initialization
  }

  toggleBilling(): void {
    this.isYearly = !this.isYearly;
  }

  getCurrentPrice(plan: PricingPlan): number {
    return this.isYearly ? plan.yearlyPrice : plan.price;
  }

  getSavings(plan: PricingPlan): number {
    const monthlyTotal = plan.price * 12;
    return monthlyTotal - plan.yearlyPrice;
  }

  trackByPlan(index: number, plan: PricingPlan): string {
    return plan.id;
  }
}