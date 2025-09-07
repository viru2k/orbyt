import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  currency: string;
  period: string;
  clients: string;
  features: string[];
  popular?: boolean;
  badge?: string;
}

@Component({
  selector: 'app-pricing-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="pricing-section" id="pricing">
      <div class="container">
        <!-- Section Header -->
        <div class="section-header">
          <h2 class="section-title">
            Planes diseñados para hacer crecer tu
            <span class="highlight">negocio</span>
          </h2>
          <p class="section-subtitle">
            Escoge el plan perfecto para tu negocio. Comienza con 14 días gratis, sin tarjeta de crédito.
          </p>
        </div>

        <!-- Billing Toggle -->
        <div class="billing-toggle">
          <span class="toggle-label" [class.active]="!isAnnual">Mensual</span>
          <button class="toggle-switch" [class.annual]="isAnnual" (click)="toggleBilling()">
            <span class="toggle-slider"></span>
          </button>
          <span class="toggle-label" [class.active]="isAnnual">
            Anual 
            <span class="discount-badge">-20%</span>
          </span>
        </div>

        <!-- Pricing Cards -->
        <div class="pricing-grid">
          <div class="pricing-card" 
               *ngFor="let plan of plans" 
               [class.popular]="plan.popular">
            
            <!-- Popular Badge -->
            <div class="popular-badge" *ngIf="plan.popular">
              <i class="pi pi-star"></i>
              <span>Más Popular</span>
            </div>

            <div class="card-header">
              <h3 class="plan-name">{{ plan.name }}</h3>
              <div class="price-container">
                <span class="currency">€</span>
                <span class="price">{{ getCurrentPrice(plan) }}</span>
                <span class="period">/{{ isAnnual ? 'año' : 'mes' }}</span>
              </div>
              <p class="price-description" *ngIf="isAnnual && plan.originalPrice">
                <span class="original-price">€{{ plan.originalPrice * 12 }}/año</span>
                Ahorras €{{ (plan.originalPrice - plan.price) * 12 }} al año
              </p>
            </div>

            <div class="card-body">
              <div class="clients-info">
                <i class="pi pi-users"></i>
                <span>{{ plan.clients }}</span>
              </div>
              
              <ul class="features-list">
                <li *ngFor="let feature of plan.features" class="feature-item">
                  <i class="pi pi-check"></i>
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>

            <div class="card-footer">
              <a [routerLink]="['/auth/register']" 
                 [queryParams]="{plan: plan.id}"
                 class="select-plan-btn"
                 [class.primary]="plan.popular">
                Empezar Gratis
              </a>
              <p class="trial-info">Prueba gratuita de 14 días</p>
            </div>
          </div>
        </div>

        <!-- Features Comparison -->
        <div class="features-comparison">
          <h3>Todas las funcionalidades incluidas</h3>
          <div class="comparison-grid">
            <div class="feature-category">
              <h4><i class="pi pi-calendar"></i> Gestión de Citas</h4>
              <ul>
                <li>Reservas online 24/7</li>
                <li>Recordatorios automáticos</li>
                <li>Sincronización calendarios</li>
                <li>Gestión de disponibilidad</li>
              </ul>
            </div>
            <div class="feature-category">
              <h4><i class="pi pi-file-pdf"></i> Facturación</h4>
              <ul>
                <li>Facturas profesionales</li>
                <li>Seguimiento de pagos</li>
                <li>Integración bancaria</li>
                <li>Cumplimiento fiscal</li>
              </ul>
            </div>
            <div class="feature-category">
              <h4><i class="pi pi-users"></i> Gestión de Clientes</h4>
              <ul>
                <li>Base de datos centralizada</li>
                <li>Historial completo</li>
                <li>Comunicación personalizada</li>
                <li>Segmentación avanzada</li>
              </ul>
            </div>
            <div class="feature-category">
              <h4><i class="pi pi-chart-bar"></i> Análisis y Reportes</h4>
              <ul>
                <li>Dashboard en tiempo real</li>
                <li>Reportes automáticos</li>
                <li>KPIs personalizables</li>
                <li>Predicciones de ingresos</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="pricing-faq">
          <h3>Preguntas Frecuentes</h3>
          <div class="faq-grid">
            <div class="faq-item">
              <h5>¿Puedo cambiar de plan en cualquier momento?</h5>
              <p>Sí, puedes upgrade o downgrade tu plan cuando quieras. Los cambios se reflejan inmediatamente.</p>
            </div>
            <div class="faq-item">
              <h5>¿Qué incluye la prueba gratuita?</h5>
              <p>14 días completos con acceso a todas las funcionalidades del plan que elijas, sin restricciones.</p>
            </div>
            <div class="faq-item">
              <h5>¿Hay costos adicionales?</h5>
              <p>No, todos los precios incluyen IVA y no hay costos de configuración ni comisiones ocultas.</p>
            </div>
            <div class="faq-item">
              <h5>¿Cómo funciona la garantía?</h5>
              <p>Si no estás satisfecho en los primeros 30 días, te devolvemos el 100% de tu dinero.</p>
            </div>
          </div>
        </div>

        <!-- Bottom CTA -->
        <div class="pricing-cta">
          <h3>¿Listo para comenzar?</h3>
          <p>Únete a miles de profesionales que ya están creciendo con Orbyt</p>
          <div class="cta-buttons">
            <a [routerLink]="['/auth/register']" class="cta-primary">
              <i class="pi pi-rocket"></i>
              Empezar Gratis
            </a>
            <button class="cta-secondary" (click)="scrollToDemo()">
              <i class="pi pi-play"></i>
              Ver Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./pricing-preview.component.scss']
})
export class PricingPreviewComponent {
  isAnnual = false;

  plans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Emprendedores',
      price: 29,
      originalPrice: 36,
      currency: 'EUR',
      period: 'mes',
      clients: 'Hasta 100 clientes',
      features: [
        'Gestión básica de citas',
        'Facturación profesional',
        'Base de datos de clientes',
        'Reportes básicos',
        'App móvil incluida',
        'Soporte por email',
        '5GB de almacenamiento'
      ]
    },
    {
      id: 'business',
      name: 'Pequeñas Empresas',
      price: 79,
      originalPrice: 99,
      currency: 'EUR',
      period: 'mes',
      clients: 'Hasta 1,000 clientes',
      popular: true,
      features: [
        'Todo lo del plan Emprendedor',
        'Reservas online 24/7',
        'Recordatorios automáticos',
        'Gestión de inventario',
        'Reportes avanzados',
        'Integraciones con terceros',
        'Soporte prioritario',
        '50GB de almacenamiento',
        'Gestión multi-usuario'
      ]
    },
    {
      id: 'enterprise',
      name: 'Corporaciones',
      price: 199,
      originalPrice: 249,
      currency: 'EUR',
      period: 'mes',
      clients: 'Clientes ilimitados',
      features: [
        'Todo lo del plan Empresas',
        'Personalización completa',
        'API completa disponible',
        'Manager de cuenta dedicado',
        'Formación especializada',
        'SLA 99.9% uptime',
        'Backups prioritarios',
        'Almacenamiento ilimitado',
        'White label disponible'
      ]
    }
  ];

  toggleBilling(): void {
    this.isAnnual = !this.isAnnual;
  }

  getCurrentPrice(plan: PricingPlan): number {
    if (this.isAnnual && plan.originalPrice) {
      // 20% discount for annual billing
      return Math.round(plan.price * 12 * 0.8);
    }
    return this.isAnnual ? plan.price * 12 : plan.price;
  }

  scrollToDemo(): void {
    const element = document.getElementById('how-it-works');
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}