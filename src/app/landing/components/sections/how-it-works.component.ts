import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, state, style, transition, animate, stagger, query } from '@angular/animations';

interface Step {
  number: number;
  icon: string;
  title: string;
  description: string;
  details: string[];
  time: string;
  color: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="how-it-works-section">
      <div class="container">
        <!-- Section Header -->
        <div class="section-header" [@fadeInUp]>
          <h2 class="section-title">
            Comienza en <span class="highlight">minutos</span>,
            no en semanas
          </h2>
          <p class="section-subtitle">
            Nuestro proceso de onboarding está diseñado para que puedas empezar 
            a usar Orbyt inmediatamente, sin complicaciones técnicas.
          </p>
        </div>

        <!-- Timeline -->
        <div class="timeline-container" [@staggerSteps]>
          <!-- Timeline Line -->
          <div class="timeline-line"></div>
          
          <div class="steps-container">
            <div class="step-item" 
                 *ngFor="let step of steps; trackBy: trackByStep; let i = index"
                 [@slideInUp]
                 [class.reverse]="i % 2 === 1">
              
              <!-- Step Number Circle -->
              <div class="step-number" [style.background]="step.color">
                <span>{{ step.number }}</span>
              </div>
              
              <!-- Step Content -->
              <div class="step-content">
                <div class="step-card">
                  <div class="step-icon" [style.color]="step.color">
                    <i [class]="step.icon"></i>
                  </div>
                  
                  <div class="step-info">
                    <div class="step-header">
                      <h3 class="step-title">{{ step.title }}</h3>
                      <div class="step-time">
                        <i class="pi pi-clock"></i>
                        {{ step.time }}
                      </div>
                    </div>
                    
                    <p class="step-description">{{ step.description }}</p>
                    
                    <ul class="step-details">
                      <li *ngFor="let detail of step.details" class="detail-item">
                        <i class="pi pi-check"></i>
                        <span>{{ detail }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Setup CTA -->
        <div class="quick-setup-cta" [@fadeInUp]>
          <div class="cta-card">
            <div class="cta-content">
              <h3>¿Necesitas ayuda con la configuración?</h3>
              <p>
                Nuestro equipo de éxito del cliente te ayuda gratuitamente a configurar 
                Orbyt según las necesidades específicas de tu negocio.
              </p>
              <div class="cta-features">
                <div class="cta-feature">
                  <i class="pi pi-video"></i>
                  <span>Sesión de onboarding 1:1</span>
                </div>
                <div class="cta-feature">
                  <i class="pi pi-phone"></i>
                  <span>Soporte telefónico gratuito</span>
                </div>
                <div class="cta-feature">
                  <i class="pi pi-book"></i>
                  <span>Biblioteca de recursos</span>
                </div>
              </div>
            </div>
            <div class="cta-actions">
              <a routerLink="/auth/registro" class="btn btn-primary">
                <i class="pi pi-play-circle"></i>
                Comenzar Ahora
              </a>
              <button class="btn btn-secondary" (click)="scheduleDemo()">
                <i class="pi pi-calendar-plus"></i>
                Agendar Demo
              </button>
            </div>
          </div>
        </div>

        <!-- Success Metrics -->
        <div class="success-metrics" [@fadeInUp]>
          <div class="metrics-header">
            <h3>Resultados que puedes esperar</h3>
            <p>Basado en datos de más de 1,500 profesionales usando Orbyt</p>
          </div>
          
          <div class="metrics-grid">
            <div class="metric-card" *ngFor="let metric of successMetrics">
              <div class="metric-icon" [style.color]="metric.color">
                <i [class]="metric.icon"></i>
              </div>
              <div class="metric-value">{{ metric.value }}</div>
              <div class="metric-label">{{ metric.label }}</div>
              <div class="metric-timeframe">{{ metric.timeframe }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./how-it-works.component.scss'],
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
        animate('600ms ease-out')
      ])
    ]),
    trigger('staggerSteps', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger(300, [
            animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class HowItWorksComponent implements OnInit {

  steps: Step[] = [
    {
      number: 1,
      icon: 'pi pi-user-plus',
      title: 'Regístrate en 2 minutos',
      description: 'Crea tu cuenta con información básica y verifica tu email. Sin complicaciones ni datos innecesarios.',
      details: [
        'Solo email y contraseña necesarios',
        'Verificación instantánea por email',
        '14 días de prueba gratis, sin tarjeta',
        'Acceso inmediato a todas las funciones'
      ],
      time: '2 min',
      color: '#2563eb'
    },
    {
      number: 2,
      icon: 'pi pi-cog',
      title: 'Configura tu espacio',
      description: 'Personaliza Orbyt con tu información comercial, servicios y horarios de trabajo.',
      details: [
        'Asistente de configuración guiada',
        'Importa datos existentes (opcional)',
        'Define servicios y precios',
        'Configura horarios y disponibilidad'
      ],
      time: '10 min',
      color: '#10b981'
    },
    {
      number: 3,
      icon: 'pi pi-users',
      title: 'Invita a tu equipo',
      description: 'Agrega colaboradores y define permisos. Invita clientes al portal de autogestión.',
      details: [
        'Invitaciones por email automáticas',
        'Roles y permisos personalizables',
        'Portal de clientes autoservicio',
        'Training integrado para el equipo'
      ],
      time: '5 min',
      color: '#f59e0b'
    },
    {
      number: 4,
      icon: 'pi pi-rocket',
      title: 'Comienza a gestionar',
      description: 'Tu negocio está listo. Agenda la primera cita, registra clientes y genera facturas profesionales.',
      details: [
        'Dashboard personalizado listo',
        'Primera cita en el calendario',
        'Cliente de prueba configurado',
        'Factura de ejemplo generada'
      ],
      time: '0 min',
      color: '#8b5cf6'
    }
  ];

  successMetrics = [
    {
      icon: 'pi pi-clock',
      value: '10 horas',
      label: 'Ahorradas por semana',
      timeframe: 'Promedio primer mes',
      color: '#2563eb'
    },
    {
      icon: 'pi pi-trending-up',
      value: '+35%',
      label: 'Aumento en eficiencia',
      timeframe: 'Primeros 30 días',
      color: '#10b981'
    },
    {
      icon: 'pi pi-users',
      value: '80%',
      label: 'Reducción no-shows',
      timeframe: 'Con recordatorios automáticos',
      color: '#f59e0b'
    },
    {
      icon: 'pi pi-heart-fill',
      value: '98%',
      label: 'Satisfacción del cliente',
      timeframe: 'Medición continua',
      color: '#ef4444'
    }
  ];

  ngOnInit(): void {
    // Initialize component
  }

  trackByStep(index: number, step: Step): number {
    return step.number;
  }

  scheduleDemo(): void {
    // TODO: Open demo scheduling modal or redirect
    console.log('Scheduling demo...');
    // For now, redirect to contact page
    window.open('/contacto', '_blank');
  }
}