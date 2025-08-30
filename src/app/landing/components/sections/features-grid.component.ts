import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, state, style, transition, animate, stagger, query } from '@angular/animations';

interface Feature {
  icon: string;
  title: string;
  description: string;
  benefits: string[];
  color: string;
  link?: string;
}

@Component({
  selector: 'app-features-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="features-section">
      <div class="container">
        <!-- Section Header -->
        <div class="section-header" [@fadeInUp]>
          <h2 class="section-title">
            Todo lo que necesitas en 
            <span class="highlight">un solo lugar</span>
          </h2>
          <p class="section-subtitle">
            Orbyt integra todas las herramientas esenciales para gestionar tu negocio de servicios 
            de manera profesional, eficiente y sin complicaciones.
          </p>
        </div>

        <!-- Features Grid -->
        <div class="features-grid" [@staggerFeatures]>
          <div class="feature-card" 
               *ngFor="let feature of features; trackBy: trackByFeature; let i = index"
               [@slideInUp]
               [attr.data-index]="i">
            
            <div class="feature-icon" [style.color]="feature.color">
              <i [class]="feature.icon"></i>
            </div>
            
            <div class="feature-content">
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-description">{{ feature.description }}</p>
              
              <ul class="feature-benefits">
                <li *ngFor="let benefit of feature.benefits" class="benefit-item">
                  <i class="pi pi-check benefit-check"></i>
                  <span>{{ benefit }}</span>
                </li>
              </ul>
              
              <a *ngIf="feature.link" [routerLink]="feature.link" class="feature-link">
                Saber más
                <i class="pi pi-arrow-right"></i>
              </a>
            </div>
            
            <!-- Background decoration -->
            <div class="feature-bg" [style.background]="feature.color + '10'"></div>
          </div>
        </div>

        <!-- Integration Preview -->
        <div class="integration-preview" [@fadeInUp]>
          <div class="integration-header">
            <h3>Se integra con tus herramientas favoritas</h3>
            <p>Conecta Orbyt con las aplicaciones que ya usas diariamente</p>
          </div>
          
          <div class="integration-logos">
            <div class="integration-item" *ngFor="let integration of integrations">
              <img [src]="integration.logo" [alt]="integration.name" class="integration-logo">
              <span class="integration-name">{{ integration.name }}</span>
            </div>
          </div>
          
          <div class="integration-cta">
            <a routerLink="/funcionalidades" class="btn btn-outline">
              Ver todas las integraciones
              <i class="pi pi-external-link"></i>
            </a>
          </div>
        </div>

        <!-- Stats Bar -->
        <div class="stats-bar" [@fadeInUp]>
          <div class="stat" *ngFor="let stat of quickStats">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./features-grid.component.scss'],
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
        transform: 'translateY(50px)'
      })),
      transition('void => *', [
        animate('500ms ease-out')
      ])
    ]),
    trigger('staggerFeatures', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger(100, [
            animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class FeaturesGridComponent implements OnInit {

  features: Feature[] = [
    {
      icon: 'pi pi-calendar',
      title: 'Agenda Inteligente',
      description: 'Gestiona citas, horarios y disponibilidad con recordatorios automáticos por SMS y email.',
      benefits: [
        'Recordatorios automáticos reducen no-shows en 80%',
        'Sincronización con Google Calendar e iCal',
        'Reservas online 24/7 para tus clientes',
        'Gestión de salas y recursos'
      ],
      color: '#2563eb',
      link: '/funcionalidades#agenda'
    },
    {
      icon: 'pi pi-users',
      title: 'Gestión de Clientes',
      description: 'Base de datos completa con historial, notas, documentos y comunicación centralizada.',
      benefits: [
        'Perfiles completos con historial detallado',
        'Segmentación automática por servicios',
        'Comunicación integrada (email, SMS, WhatsApp)',
        'Documentos y consentimientos digitales'
      ],
      color: '#10b981',
      link: '/funcionalidades#clientes'
    },
    {
      icon: 'pi pi-file-pdf',
      title: 'Facturación Automática',
      description: 'Genera facturas profesionales, gestiona pagos y mantén control fiscal automático.',
      benefits: [
        'Facturación automática post-servicio',
        'Cumplimiento fiscal (AEAT, IVA)',
        'Pagos online integrados',
        'Reportes financieros en tiempo real'
      ],
      color: '#f59e0b',
      link: '/funcionalidades#facturacion'
    },
    {
      icon: 'pi pi-shopping-bag',
      title: 'Catálogo de Servicios',
      description: 'Define servicios, precios, duraciones y promociones de manera flexible y profesional.',
      benefits: [
        'Catálogo ilimitado de servicios',
        'Precios dinámicos y promociones',
        'Paquetes y bonos de servicios',
        'Control de inventario básico'
      ],
      color: '#8b5cf6',
      link: '/funcionalidades#servicios'
    },
    {
      icon: 'pi pi-chart-line',
      title: 'Analytics y Reportes',
      description: 'Métricas en tiempo real sobre rendimiento, ingresos, clientes y eficiencia operativa.',
      benefits: [
        'Dashboard ejecutivo en tiempo real',
        'Análisis de rentabilidad por servicio',
        'Métricas de satisfacción del cliente',
        'Reportes personalizables y exportables'
      ],
      color: '#06b6d4',
      link: '/funcionalidades#analytics'
    },
    {
      icon: 'pi pi-link',
      title: 'Integraciones y API',
      description: 'Conecta con herramientas existentes mediante API REST y integraciones nativas.',
      benefits: [
        'API REST completa para desarrolladores',
        'Webhooks para automatizaciones',
        'Integraciones nativas (Google, Stripe, etc.)',
        'Zapier para conexiones avanzadas'
      ],
      color: '#ef4444',
      link: '/funcionalidades#integraciones'
    }
  ];

  integrations = [
    { name: 'Google Calendar', logo: '/assets/images/integrations/google-calendar.svg' },
    { name: 'Stripe', logo: '/assets/images/integrations/stripe.svg' },
    { name: 'WhatsApp Business', logo: '/assets/images/integrations/whatsapp.svg' },
    { name: 'Mailchimp', logo: '/assets/images/integrations/mailchimp.svg' },
    { name: 'Zapier', logo: '/assets/images/integrations/zapier.svg' },
    { name: 'Zoom', logo: '/assets/images/integrations/zoom.svg' }
  ];

  quickStats = [
    { value: '10h', label: 'Ahorradas por semana' },
    { value: '35%', label: 'Más eficiencia' },
    { value: '80%', label: 'Menos no-shows' },
    { value: '24/7', label: 'Disponibilidad' }
  ];

  ngOnInit(): void {
    // Initialize any animations or data loading
  }

  trackByFeature(index: number, feature: Feature): string {
    return feature.title;
  }
}