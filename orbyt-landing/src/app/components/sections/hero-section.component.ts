import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="hero-section" id="hero">
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">
              La plataforma que hace crecer tu
              <span class="highlight">negocio profesional</span>
            </h1>
            <p class="hero-subtitle">
              Sistema integral de gestión para consultorios, clínicas, salones de belleza, 
              peluquerías, centros de estética y cualquier negocio de servicios profesionales.
            </p>
            <div class="hero-actions">
              <a [routerLink]="['/auth/register']" class="btn btn-primary">
                <i class="pi pi-rocket"></i>
                Comenzar Gratis
              </a>
              <button class="btn btn-secondary" (click)="scrollToDemo()">
                <i class="pi pi-play"></i>
                Ver Demo
              </button>
            </div>
            <div class="hero-features">
              <div class="feature-item">
                <i class="pi pi-check-circle"></i>
                <span>14 días gratis</span>
              </div>
              <div class="feature-item">
                <i class="pi pi-check-circle"></i>
                <span>Sin tarjeta de crédito</span>
              </div>
              <div class="feature-item">
                <i class="pi pi-check-circle"></i>
                <span>Configuración en 5 minutos</span>
              </div>
            </div>
          </div>
          <div class="hero-image">
            <div class="dashboard-mockup">
              <div class="mockup-header">
                <div class="mockup-nav">
                  <div class="nav-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div class="nav-title">Orbyt Dashboard</div>
                </div>
              </div>
              <div class="mockup-content">
                <div class="dashboard-cards">
                  <div class="stat-card">
                    <i class="pi pi-euro"></i>
                    <span class="stat-value">€4,235</span>
                    <span class="stat-label">Ingresos mes</span>
                  </div>
                  <div class="stat-card">
                    <i class="pi pi-calendar"></i>
                    <span class="stat-value">8</span>
                    <span class="stat-label">Citas hoy</span>
                  </div>
                  <div class="stat-card">
                    <i class="pi pi-users"></i>
                    <span class="stat-value">342</span>
                    <span class="stat-label">Clientes</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="floating-card card-1">
              <i class="pi pi-calendar"></i>
              <span>Próxima: Ana García - 15:30</span>
            </div>
            <div class="floating-card card-2">
              <i class="pi pi-check-circle"></i>
              <span>6 citas completadas hoy</span>
            </div>
            <div class="floating-card card-3">
              <i class="pi pi-chart-line"></i>
              <span>↗️ +15% vs mes anterior</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./hero-section.component.scss']
})
export class HeroSectionComponent {
  
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