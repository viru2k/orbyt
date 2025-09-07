import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  benefits: string[];
}

@Component({
  selector: 'app-features-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="features-section" id="features">
      <div class="container">
        <!-- Section Header -->
        <div class="section-header" [@fadeInUp]>
          <h2 class="section-title">
            Todo lo que necesitas para hacer crecer tu
            <span class="highlight">negocio</span>
          </h2>
          <p class="section-subtitle">
            Una plataforma completa diseñada específicamente para profesionales autónomos
            y pequeñas empresas que buscan optimizar su gestión diaria.
          </p>
        </div>

        <!-- Features Grid -->
        <div class="features-grid">
          <div class="feature-card" 
               *ngFor="let feature of features; trackBy: trackByFeature"
               [@slideInUp]="feature"
               [style.--accent-color]="feature.color">
            <div class="feature-icon">
              <i [class]="feature.icon"></i>
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
            <ul class="feature-benefits">
              <li *ngFor="let benefit of feature.benefits" class="benefit-item">
                <i class="pi pi-check"></i>
                <span>{{ benefit }}</span>
              </li>
            </ul>
            <div class="feature-action">
              <button class="learn-more-btn">
                Saber más <i class="pi pi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom CTA -->
        <div class="features-cta" [@fadeInUp]>
          <div class="cta-content">
            <h3>¿Listo para revolucionar tu negocio?</h3>
            <p>Únete a miles de profesionales que ya están creciendo con Orbyt</p>
            <a href="#" class="cta-button">
              <i class="pi pi-rocket"></i>
              Empezar ahora
            </a>
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
    ])
  ]
})
export class FeaturesGridComponent {
  
  features: Feature[] = [
    {
      id: 1,
      title: 'Gestión de Citas y Agenda',
      description: 'Sistema completo de agendas para profesionales. Reservas online, recordatorios automáticos y sincronización con calendarios externos.',
      icon: 'pi pi-calendar',
      color: '#667eea',
      benefits: [
        'Reservas online 24/7 para clientes',
        'Recordatorios automáticos SMS/Email/WhatsApp',
        'Sincronización Google Calendar y Outlook',
        'Gestión de salas y recursos',
        'Configuración de disponibilidad flexible',
        'Sistema de lista de espera'
      ]
    },
    {
      id: 2,
      title: 'Facturación Profesional',
      description: 'Crea, envía y gestiona facturas profesionales cumpliendo toda la normativa fiscal española. Control total de tu flujo de caja.',
      icon: 'pi pi-file-pdf',
      color: '#10b981',
      benefits: [
        'Facturas profesionales automáticas',
        'Cumplimiento normativo español (AEAT)',
        'Seguimiento de pagos pendientes',
        'Facturación recurrente para suscripciones',
        'Integración bancaria para conciliación',
        'Exportación contable (A3CON, ContaPlus)'
      ]
    },
    {
      id: 3,
      title: 'Gestión Completa de Clientes',
      description: 'CRM potente diseñado para profesionales de servicios. Historial completo, seguimiento personalizado y comunicación integrada.',
      icon: 'pi pi-users',
      color: '#8b5cf6',
      benefits: [
        'Fichas de cliente completas con historial',
        'Sistemas de recompensas y fidelización',
        'Segmentación avanzada de clientela',
        'Comunicación multicanal integrada',
        'Importación desde Excel/Google Sheets',
        'Tokens de consulta para acceso externo'
      ]
    },
    {
      id: 4,
      title: 'Control de Inventario',
      description: 'Gestiona productos, servicios y stock. Ideal para clínicas, salones de belleza, talleres y negocios con inventario.',
      icon: 'pi pi-box',
      color: '#f59e0b',
      benefits: [
        'Control de stock en tiempo real',
        'Alertas automáticas de stock mínimo',
        'Gestión de movimientos de inventario',
        'Códigos de barras y SKU',
        'Dashboard de inventario con métricas',
        'Histórico de movimientos y valorización'
      ]
    },
    {
      id: 5,
      title: 'Análisis y Reportes',
      description: 'Toma decisiones basadas en datos reales. Dashboard completo con métricas de negocio, tendencias e informes automáticos.',
      icon: 'pi pi-chart-bar',
      color: '#ef4444',
      benefits: [
        'Dashboard empresarial en tiempo real',
        'Reportes automáticos de ingresos',
        'Análisis de ocupación y productividad',
        'Métricas de satisfacción de clientes',
        'Predicciones de ingresos y tendencias',
        'Exportación de reportes (PDF, Excel)'
      ]
    },
    {
      id: 6,
      title: 'Sistema Multi-Negocio',
      description: 'Adaptable a cualquier sector: medicina, belleza, peluquería, psicología, veterinaria, consultoría y más.',
      icon: 'pi pi-cog',
      color: '#06b6d4',
      benefits: [
        'Templates específicos por sector',
        'Configuración personalizable total',
        'Tipos de consulta según especialidad',
        'Formularios dinámicos adaptables',
        'Gestión de especialistas y horarios',
        'Escalable desde autónomos a corporaciones'
      ]
    }
  ];

  trackByFeature(index: number, feature: Feature): number {
    return feature.id;
  }
}