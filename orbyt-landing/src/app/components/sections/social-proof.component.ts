import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ClientLogo {
  name: string;
  logo: string;
  industry: string;
}

interface Testimonial {
  quote: string;
  author: string;
  title: string;
  company: string;
  avatar: string;
}

@Component({
  selector: 'app-social-proof',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="social-proof-section">
      <div class="container">
        <!-- Main Message -->
        <div class="social-proof-header">
          <h2 class="section-title">
            Usado por más de <span class="highlight">1,500 profesionales</span> 
            en toda España y Latinoamérica
          </h2>
          <p class="section-subtitle">
            Clínicas, consultores, terapeutas y empresas de servicios confían en Orbyt 
            para gestionar su día a día profesional.
          </p>
        </div>

        <!-- Client Logos -->
        <div class="clients-logos">
          <div class="logos-container">
            <div class="logo-item" *ngFor="let client of clientLogos; trackBy: trackByClient">
              <img [src]="client.logo" [alt]="client.name" class="client-logo">
              <span class="client-industry">{{ client.industry }}</span>
            </div>
          </div>
        </div>

        <!-- Key Statistics -->
        <div class="key-stats">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">1,500+</div>
              <div class="stat-label">Profesionales Activos</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">50k+</div>
              <div class="stat-label">Citas Gestionadas</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">€2.5M+</div>
              <div class="stat-label">Facturación Procesada</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">98%</div>
              <div class="stat-label">Satisfacción Cliente</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">24/7</div>
              <div class="stat-label">Soporte Disponible</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">15 min</div>
              <div class="stat-label">Setup Promedio</div>
            </div>
          </div>
        </div>

        <!-- Featured Testimonial -->
        <div class="featured-testimonial">
          <div class="testimonial-card">
            <div class="testimonial-content">
              <div class="quote-mark">
                <i class="pi pi-quote-left"></i>
              </div>
              <blockquote class="testimonial-quote">
                "Orbyt transformó completamente la gestión de mi clínica. 
                Ahorro más de 10 horas semanales en tareas administrativas 
                y mis pacientes están más satisfechos con el sistema de recordatorios automáticos."
              </blockquote>
              <div class="testimonial-author">
                <img src="/assets/images/testimonials/maria-gonzalez.jpg" 
                     alt="Dra. María González" class="author-avatar">
                <div class="author-info">
                  <div class="author-name">Dra. María González</div>
                  <div class="author-title">Directora, Clínica Wellness Madrid</div>
                </div>
              </div>
            </div>
            <div class="testimonial-metrics">
              <div class="metric">
                <div class="metric-value">+35%</div>
                <div class="metric-label">Eficiencia</div>
              </div>
              <div class="metric">
                <div class="metric-value">-10h</div>
                <div class="metric-label">Semanales</div>
              </div>
              <div class="metric">
                <div class="metric-value">5★</div>
                <div class="metric-label">Satisfacción</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Industry Badges -->
        <div class="industry-badges">
          <div class="badges-grid">
            <div class="industry-badge">
              <div class="badge-icon">🏥</div>
              <div class="badge-label">Clínicas & Salud</div>
            </div>
            <div class="industry-badge">
              <div class="badge-icon">💼</div>
              <div class="badge-label">Consultoría</div>
            </div>
            <div class="industry-badge">
              <div class="badge-icon">💆‍♀️</div>
              <div class="badge-label">Belleza & Wellness</div>
            </div>
            <div class="industry-badge">
              <div class="badge-icon">🧘</div>
              <div class="badge-label">Terapia & Coaching</div>
            </div>
            <div class="industry-badge">
              <div class="badge-icon">⚖️</div>
              <div class="badge-label">Servicios Legales</div>
            </div>
            <div class="industry-badge">
              <div class="badge-icon">🔧</div>
              <div class="badge-label">Servicios Técnicos</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./social-proof.component.scss']
})
export class SocialProofComponent implements OnInit {

  clientLogos: ClientLogo[] = [
    { name: 'Clínica Wellness Madrid', logo: '/assets/images/clients/wellness-madrid.png', industry: 'Salud' },
    { name: 'Consultoría García & Asociados', logo: '/assets/images/clients/garcia-consultoria.png', industry: 'Consultoría' },
    { name: 'Centro Terapéutico Barcelona', logo: '/assets/images/clients/centro-terapeutico.png', industry: 'Terapia' },
    { name: 'Spa & Beauty Center', logo: '/assets/images/clients/spa-beauty.png', industry: 'Belleza' },
    { name: 'Despacho Legal Hernández', logo: '/assets/images/clients/legal-hernandez.png', industry: 'Legal' },
    { name: 'Fisioterapia Valencia', logo: '/assets/images/clients/fisio-valencia.png', industry: 'Fisioterapia' }
  ];

  ngOnInit(): void {
    // Start logo carousel animation
    this.startLogoAnimation();
  }

  trackByClient(index: number, client: ClientLogo): string {
    return client.name;
  }

  private startLogoAnimation(): void {
    // Smooth infinite scroll animation will be handled by CSS
    // This method can be used for additional JavaScript animations if needed
  }
}