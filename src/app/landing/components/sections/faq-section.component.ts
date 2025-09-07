import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="faq-section">
      <div class="container">
        <!-- Section Header -->
        <div class="section-header" [@fadeInUp]>
          <h2 class="section-title">
            Preguntas <span class="highlight">frecuentes</span>
          </h2>
          <p class="section-subtitle">
            Resolvemos las dudas más comunes sobre Orbyt. 
            ¿No encuentras tu respuesta? <a href="/contacto">Contáctanos</a> directamente.
          </p>
        </div>

        <!-- FAQ Categories Filter -->
        <div class="faq-categories" [@fadeInUp]>
          <button class="category-btn"
                  *ngFor="let category of categories"
                  [class.active]="selectedCategory() === category.value"
                  (click)="filterByCategory(category.value)">
            <i [class]="category.icon"></i>
            {{ category.label }}
          </button>
        </div>

        <!-- FAQ Grid -->
        <div class="faq-grid">
          <!-- Left Column -->
          <div class="faq-column">
            <div class="faq-item" 
                 *ngFor="let faq of leftColumnFAQs(); trackBy: trackByFaq"
                 [@slideInLeft]>
              <div class="faq-question" 
                   (click)="toggleFAQ(faq)"
                   [class.active]="faq.isOpen">
                <h3>{{ faq.question }}</h3>
                <i class="pi pi-angle-down toggle-icon" 
                   [class.rotated]="faq.isOpen"></i>
              </div>
              <div class="faq-answer" 
                   [@expandCollapse]="faq.isOpen ? 'expanded' : 'collapsed'">
                <div class="answer-content" [innerHTML]="faq.answer"></div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="faq-column">
            <div class="faq-item" 
                 *ngFor="let faq of rightColumnFAQs(); trackBy: trackByFaq"
                 [@slideInRight]>
              <div class="faq-question" 
                   (click)="toggleFAQ(faq)"
                   [class.active]="faq.isOpen">
                <h3>{{ faq.question }}</h3>
                <i class="pi pi-angle-down toggle-icon" 
                   [class.rotated]="faq.isOpen"></i>
              </div>
              <div class="faq-answer" 
                   [@expandCollapse]="faq.isOpen ? 'expanded' : 'collapsed'">
                <div class="answer-content" [innerHTML]="faq.answer"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Still Have Questions -->
        <div class="faq-cta" [@fadeInUp]>
          <div class="cta-content">
            <h3>¿Aún tienes dudas?</h3>
            <p>Nuestro equipo de soporte está disponible para ayudarte con cualquier pregunta específica sobre tu caso de uso.</p>
            <div class="cta-buttons">
              <a href="/contacto" class="btn btn-primary">
                <i class="pi pi-envelope"></i>
                Contactar Soporte
              </a>
              <button class="btn btn-secondary" (click)="scheduleCall()">
                <i class="pi pi-phone"></i>
                Agendar Llamada
              </button>
              <a href="/recursos/centro-ayuda" class="btn btn-outline">
                <i class="pi pi-book"></i>
                Centro de Ayuda
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./faq-section.component.scss'],
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
    trigger('slideInLeft', [
      state('void', style({
        opacity: 0,
        transform: 'translateX(-30px)'
      })),
      transition('void => *', [
        animate('500ms ease-out')
      ])
    ]),
    trigger('slideInRight', [
      state('void', style({
        opacity: 0,
        transform: 'translateX(30px)'
      })),
      transition('void => *', [
        animate('500ms ease-out')
      ])
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1,
        overflow: 'visible'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class FaqSectionComponent implements OnInit {

  selectedCategory = signal('all');

  categories = [
    { value: 'all', label: 'Todas', icon: 'pi pi-list' },
    { value: 'pricing', label: 'Precios', icon: 'pi pi-euro' },
    { value: 'features', label: 'Funciones', icon: 'pi pi-cog' },
    { value: 'security', label: 'Seguridad', icon: 'pi pi-shield' },
    { value: 'support', label: 'Soporte', icon: 'pi pi-headphones' }
  ];

  allFaqs: FAQ[] = [
    {
      id: 1,
      question: '¿Cuánto cuesta Orbyt?',
      answer: `Orbyt ofrece tres planes principales:
               <ul>
                 <li><strong>Starter (€29/mes)</strong>: Perfecto para freelancers</li>
                 <li><strong>Professional (€59/mes)</strong>: Ideal para pequeñas empresas</li>
                 <li><strong>Enterprise (€99/mes)</strong>: Para empresas establecidas</li>
               </ul>
               Todos los planes incluyen 14 días de prueba gratuita sin necesidad de tarjeta de crédito.`,
      category: 'pricing',
      isOpen: false
    },
    {
      id: 2,
      question: '¿Puedo cambiar de plan en cualquier momento?',
      answer: `Sí, absolutamente. Puedes hacer upgrade o downgrade de tu plan en cualquier momento desde tu dashboard. 
               Los cambios se aplican inmediatamente y solo pagas la diferencia prorrateada. 
               No hay penalizaciones ni costos ocultos por cambios de plan.`,
      category: 'pricing',
      isOpen: false
    },
    {
      id: 3,
      question: '¿Cómo funciona la prueba gratuita?',
      answer: `La prueba gratuita de 14 días te da acceso completo a todas las funciones del plan que elijas. 
               No necesitas ingresar información de tarjeta de crédito para comenzar. 
               Al finalizar la prueba, puedes decidir si continúas con un plan de pago o no.`,
      category: 'pricing',
      isOpen: false
    },
    {
      id: 4,
      question: '¿Puedo importar mis datos existentes?',
      answer: `Sí, Orbyt permite importar datos desde Excel, CSV y muchas aplicaciones populares como Google Calendar, 
               Outlook, y otros sistemas de gestión. Nuestro equipo de onboarding te ayuda gratuitamente 
               con la migración de datos durante la configuración inicial.`,
      category: 'features',
      isOpen: false
    },
    {
      id: 5,
      question: '¿Funciona en dispositivos móviles?',
      answer: `Orbyt es completamente responsive y funciona perfectamente en todos los dispositivos. 
               Además, ofrecemos apps nativas para iOS y Android que incluyen notificaciones push, 
               acceso offline limitado y sincronización automática.`,
      category: 'features',
      isOpen: false
    },
    {
      id: 6,
      question: '¿Mis datos están seguros?',
      answer: `La seguridad es nuestra prioridad máxima. Utilizamos:
               <ul>
                 <li>Cifrado SSL/TLS para todas las comunicaciones</li>
                 <li>Backups automáticos diarios</li>
                 <li>Centros de datos certificados ISO 27001</li>
                 <li>Cumplimiento total con GDPR</li>
                 <li>Autenticación de dos factores opcional</li>
               </ul>`,
      category: 'security',
      isOpen: false
    },
    {
      id: 7,
      question: '¿Cumple con la normativa española?',
      answer: `Sí, Orbyt está diseñado específicamente para cumplir con la legislación española:
               <ul>
                 <li>Facturación conforme a normativa AEAT</li>
                 <li>Cálculo automático de IVA</li>
                 <li>Integración con sistemas fiscales</li>
                 <li>Cumplimiento GDPR y LOPD</li>
                 <li>Formatos oficiales requeridos</li>
               </ul>`,
      category: 'security',
      isOpen: false
    },
    {
      id: 8,
      question: '¿Qué tipo de soporte ofrecen?',
      answer: `Ofrecemos múltiples canales de soporte según tu plan:
               <ul>
                 <li><strong>Starter</strong>: Email y chat en horario laboral</li>
                 <li><strong>Professional</strong>: Email, chat y teléfono prioritario</li>
                 <li><strong>Enterprise</strong>: Soporte 24/7 + manager dedicado</li>
               </ul>
               Todos los planes incluyen onboarding gratuito y centro de ayuda completo.`,
      category: 'support',
      isOpen: false
    },
    {
      id: 9,
      question: '¿Puedo cancelar mi suscripción cuando quiera?',
      answer: `Por supuesto. Puedes cancelar tu suscripción en cualquier momento desde tu dashboard, 
               sin penalizaciones ni preguntas. Mantienes acceso hasta el final del período facturado 
               y puedes exportar todos tus datos antes de cancelar.`,
      category: 'pricing',
      isOpen: false
    },
    {
      id: 10,
      question: '¿Orbyt se integra con otras aplicaciones?',
      answer: `Sí, Orbyt ofrece integraciones con las aplicaciones más populares:
               <ul>
                 <li>Google Calendar, Outlook Calendar</li>
                 <li>Stripe, PayPal para pagos</li>
                 <li>Mailchimp, SendGrid para email marketing</li>
                 <li>Zapier para miles de aplicaciones adicionales</li>
                 <li>API REST para integraciones personalizadas</li>
               </ul>`,
      category: 'features',
      isOpen: false
    },
    {
      id: 11,
      question: '¿Hay límites en el número de clientes?',
      answer: `Los límites varían según el plan:
               <ul>
                 <li><strong>Starter</strong>: Hasta 100 clientes</li>
                 <li><strong>Professional</strong>: Hasta 500 clientes</li>
                 <li><strong>Enterprise</strong>: Clientes ilimitados</li>
               </ul>
               Si necesitas más clientes, siempre puedes hacer upgrade a un plan superior.`,
      category: 'features',
      isOpen: false
    },
    {
      id: 12,
      question: '¿Ofrecen training para mi equipo?',
      answer: `Sí, incluimos training gratuito con todos los planes:
               <ul>
                 <li>Sesiones de onboarding 1:1</li>
                 <li>Videos tutoriales paso a paso</li>
                 <li>Webinars grupales semanales</li>
                 <li>Documentación completa en español</li>
                 <li>Training personalizado para equipos (plan Enterprise)</li>
               </ul>`,
      category: 'support',
      isOpen: false
    }
  ];

  // Computed signals for filtered FAQs
  filteredFaqs = signal<FAQ[]>([]);
  leftColumnFAQs = signal<FAQ[]>([]);
  rightColumnFAQs = signal<FAQ[]>([]);

  ngOnInit(): void {
    this.filterFAQs();
  }

  filterByCategory(category: string): void {
    this.selectedCategory.set(category);
    this.filterFAQs();
  }

  private filterFAQs(): void {
    let filtered = this.selectedCategory() === 'all' 
      ? this.allFaqs 
      : this.allFaqs.filter(faq => faq.category === this.selectedCategory());
    
    this.filteredFaqs.set(filtered);
    
    // Split into two columns
    const mid = Math.ceil(filtered.length / 2);
    this.leftColumnFAQs.set(filtered.slice(0, mid));
    this.rightColumnFAQs.set(filtered.slice(mid));
  }

  toggleFAQ(faq: FAQ): void {
    // Close all other FAQs in the same column for better UX
    this.allFaqs.forEach(f => {
      if (f.id !== faq.id) {
        f.isOpen = false;
      }
    });
    
    faq.isOpen = !faq.isOpen;
  }

  scheduleCall(): void {
    // TODO: Open calendar scheduling modal
    console.log('Scheduling support call...');
    window.open('https://calendly.com/orbyt-support', '_blank');
  }

  trackByFaq(index: number, faq: FAQ): number {
    return faq.id;
  }
}