import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface Testimonial {
  id: number;
  name: string;
  title: string;
  company: string;
  avatar: string;
  quote: string;
  rating: number;
  metrics?: {
    label: string;
    value: string;
  }[];
  industry: string;
  location: string;
  featured?: boolean;
}

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="testimonials-section">
      <div class="container">
        <!-- Section Header -->
        <div class="section-header" [@fadeInUp]>
          <h2 class="section-title">
            Lo que dicen nuestros <span class="highlight">clientes</span>
          </h2>
          <p class="section-subtitle">
            Más de 1,500 profesionales confían en Orbyt para gestionar sus negocios. 
            Descubre cómo ha transformado su día a día.
          </p>
          <div class="rating-overview">
            <div class="stars">
              <i class="pi pi-star-fill" *ngFor="let star of [1,2,3,4,5]"></i>
            </div>
            <span class="rating-text">4.8/5 basado en 500+ reseñas</span>
          </div>
        </div>

        <!-- Featured Testimonial -->
        <div class="featured-testimonial" [@slideInUp]>
          <div class="featured-card">
            <div class="quote-mark">
              <i class="pi pi-quote-left"></i>
            </div>
            <blockquote class="featured-quote">
              "Orbyt no solo cambió cómo gestionamos la clínica, sino que nos dio el control 
              total sobre nuestro tiempo. Hemos aumentado nuestra eficiencia en un 40% y 
              nuestros pacientes están más satisfechos que nunca."
            </blockquote>
            <div class="featured-author">
              <img src="/assets/images/testimonials/dr-carlos-mendoza.jpg" 
                   alt="Dr. Carlos Mendoza" class="author-avatar">
              <div class="author-info">
                <h4 class="author-name">Dr. Carlos Mendoza</h4>
                <p class="author-title">Director Médico, Clínica Dental Sonrisas</p>
                <p class="author-location">Madrid, España</p>
              </div>
            </div>
            <div class="featured-metrics">
              <div class="metric">
                <span class="metric-value">+40%</span>
                <span class="metric-label">Eficiencia</span>
              </div>
              <div class="metric">
                <span class="metric-value">200+</span>
                <span class="metric-label">Pacientes</span>
              </div>
              <div class="metric">
                <span class="metric-value">€50k</span>
                <span class="metric-label">Ahorrados/año</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Testimonials Grid -->
        <div class="testimonials-grid">
          <div class="testimonial-card" 
               *ngFor="let testimonial of visibleTestimonials(); trackBy: trackByTestimonial"
               [@slideInUp]>
            
            <div class="testimonial-header">
              <div class="author-section">
                <img [src]="testimonial.avatar" [alt]="testimonial.name" class="testimonial-avatar">
                <div class="author-details">
                  <h4 class="author-name">{{ testimonial.name }}</h4>
                  <p class="author-title">{{ testimonial.title }}</p>
                  <p class="company-name">{{ testimonial.company }}</p>
                </div>
              </div>
              <div class="rating-section">
                <div class="stars">
                  <i class="pi pi-star-fill" *ngFor="let star of getStars(testimonial.rating)"></i>
                </div>
                <div class="industry-badge">{{ testimonial.industry }}</div>
              </div>
            </div>

            <div class="testimonial-content">
              <blockquote class="testimonial-quote">
                "{{ testimonial.quote }}"
              </blockquote>
              
              <div class="testimonial-metrics" *ngIf="testimonial.metrics">
                <div class="mini-metric" *ngFor="let metric of testimonial.metrics">
                  <span class="mini-value">{{ metric.value }}</span>
                  <span class="mini-label">{{ metric.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Controls -->
        <div class="testimonials-controls" [@fadeInUp]>
          <button class="control-btn" (click)="showPrevious()" [disabled]="currentPage() === 0">
            <i class="pi pi-angle-left"></i>
          </button>
          
          <div class="pagination-dots">
            <button class="dot" 
                    *ngFor="let page of pages; let i = index"
                    [class.active]="i === currentPage()"
                    (click)="goToPage(i)">
            </button>
          </div>
          
          <button class="control-btn" (click)="showNext()" [disabled]="currentPage() === maxPage">
            <i class="pi pi-angle-right"></i>
          </button>
        </div>

        <!-- Trust Indicators -->
        <div class="trust-indicators" [@fadeInUp]>
          <div class="indicators-grid">
            <div class="trust-item">
              <i class="pi pi-shield-fill"></i>
              <span>Datos Protegidos</span>
            </div>
            <div class="trust-item">
              <i class="pi pi-verified"></i>
              <span>GDPR Compliant</span>
            </div>
            <div class="trust-item">
              <i class="pi pi-heart-fill"></i>
              <span>98% Satisfacción</span>
            </div>
            <div class="trust-item">
              <i class="pi pi-users"></i>
              <span>1,500+ Usuarios</span>
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="testimonials-cta" [@fadeInUp]>
          <h3>¿Listo para unirte a ellos?</h3>
          <p>Comienza tu prueba gratuita de 14 días y descubre por qué tantos profesionales eligen Orbyt.</p>
          <div class="cta-buttons">
            <a routerLink="/auth/registro" class="btn btn-primary btn-lg">
              <i class="pi pi-play-circle"></i>
              Comenzar Prueba Gratuita
            </a>
            <a routerLink="/recursos/casos-exito" class="btn btn-outline">
              <i class="pi pi-book"></i>
              Ver Más Casos de Éxito
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./testimonials.component.scss'],
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
    ])
  ]
})
export class TestimonialsComponent implements OnInit, OnDestroy {

  testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Dra. María González',
      title: 'Directora Médica',
      company: 'Clínica Wellness Madrid',
      avatar: '/assets/images/testimonials/maria-gonzalez.jpg',
      quote: 'Orbyt transformó completamente la gestión de mi clínica. Ahorro más de 10 horas semanales en tareas administrativas.',
      rating: 5,
      metrics: [
        { label: 'Eficiencia', value: '+35%' },
        { label: 'Tiempo Ahorrado', value: '10h/sem' }
      ],
      industry: 'Salud',
      location: 'Madrid, España',
      featured: true
    },
    {
      id: 2,
      name: 'Laura Sánchez',
      title: 'Coach Personal',
      company: 'Coaching Excellence',
      avatar: '/assets/images/testimonials/laura-sanchez.jpg',
      quote: 'La automatización de recordatorios redujo mis no-shows en un 90%. Mis clientes están más comprometidos.',
      rating: 5,
      metrics: [
        { label: 'No-shows', value: '-90%' },
        { label: 'Clientes', value: '150+' }
      ],
      industry: 'Coaching',
      location: 'Barcelona, España'
    },
    {
      id: 3,
      name: 'Miguel Torres',
      title: 'Consultor IT Senior',
      company: 'TechConsult Pro',
      avatar: '/assets/images/testimonials/miguel-torres.jpg',
      quote: 'La facturación automática y los reportes me dan el control total sobre mi negocio. Recomiendo Orbyt al 100%.',
      rating: 5,
      metrics: [
        { label: 'Facturación', value: '€80k' },
        { label: 'Clientes', value: '45' }
      ],
      industry: 'Consultoría',
      location: 'Valencia, España'
    },
    {
      id: 4,
      name: 'Ana Ruiz',
      title: 'Directora',
      company: 'Centro de Belleza Elegance',
      avatar: '/assets/images/testimonials/ana-ruiz.jpg',
      quote: 'Gestionar 3 terapeutas y 200 clientes nunca fue tan fácil. Orbyt centraliza todo en una plataforma intuitiva.',
      rating: 5,
      metrics: [
        { label: 'Staff', value: '3' },
        { label: 'Clientes', value: '200+' }
      ],
      industry: 'Belleza',
      location: 'Sevilla, España'
    },
    {
      id: 5,
      name: 'Jorge Vega',
      title: 'Fisioterapeuta',
      company: 'FisioVega Rehabilitation',
      avatar: '/assets/images/testimonials/jorge-vega.jpg',
      quote: 'Los pacientes valoran mucho poder agendar online. He aumentado mis citas en un 25% desde que uso Orbyt.',
      rating: 5,
      metrics: [
        { label: 'Citas', value: '+25%' },
        { label: 'Satisfacción', value: '98%' }
      ],
      industry: 'Fisioterapia',
      location: 'Bilbao, España'
    },
    {
      id: 6,
      name: 'Carmen López',
      title: 'Abogada Especialista',
      company: 'Bufete López & Asociados',
      avatar: '/assets/images/testimonials/carmen-lopez.jpg',
      quote: 'La gestión de documentos y la agenda integrada me permiten focalizarme en lo que realmente importa: mis clientes.',
      rating: 5,
      metrics: [
        { label: 'Casos', value: '120+' },
        { label: 'Documentos', value: '500+' }
      ],
      industry: 'Legal',
      location: 'Zaragoza, España'
    }
  ];

  // Pagination
  currentPage = signal(0);
  itemsPerPage = 3;
  pages: number[] = [];
  maxPage = 0;

  // Auto-rotate
  private rotateInterval: any;

  // Computed
  visibleTestimonials = signal<Testimonial[]>([]);

  ngOnInit(): void {
    this.calculatePagination();
    this.updateVisibleTestimonials();
    this.startAutoRotate();
  }

  ngOnDestroy(): void {
    if (this.rotateInterval) {
      clearInterval(this.rotateInterval);
    }
  }

  private calculatePagination(): void {
    this.maxPage = Math.ceil(this.testimonials.length / this.itemsPerPage) - 1;
    this.pages = Array.from({ length: this.maxPage + 1 }, (_, i) => i);
  }

  private updateVisibleTestimonials(): void {
    const startIndex = this.currentPage() * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.visibleTestimonials.set(this.testimonials.slice(startIndex, endIndex));
  }

  private startAutoRotate(): void {
    this.rotateInterval = setInterval(() => {
      if (this.currentPage() >= this.maxPage) {
        this.currentPage.set(0);
      } else {
        this.currentPage.set(this.currentPage() + 1);
      }
      this.updateVisibleTestimonials();
    }, 8000); // Rotate every 8 seconds
  }

  showNext(): void {
    if (this.currentPage() < this.maxPage) {
      this.currentPage.set(this.currentPage() + 1);
      this.updateVisibleTestimonials();
      this.resetAutoRotate();
    }
  }

  showPrevious(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
      this.updateVisibleTestimonials();
      this.resetAutoRotate();
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.updateVisibleTestimonials();
    this.resetAutoRotate();
  }

  private resetAutoRotate(): void {
    if (this.rotateInterval) {
      clearInterval(this.rotateInterval);
    }
    this.startAutoRotate();
  }

  getStars(rating: number): number[] {
    return Array.from({ length: rating }, (_, i) => i);
  }

  trackByTestimonial(index: number, testimonial: Testimonial): number {
    return testimonial.id;
  }
}