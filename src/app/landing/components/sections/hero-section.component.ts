import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="hero-section">
      <div class="hero-background">
        <div class="hero-gradient"></div>
        <div class="hero-pattern"></div>
      </div>
      
      <div class="container">
        <div class="hero-content">
          <!-- Main Content -->
          <div class="hero-text" [@fadeInUp]>
            <h1 class="hero-title">
              Gestiona tu negocio de servicios 
              <span class="highlight">como un profesional</span>
            </h1>
            
            <p class="hero-subtitle">
              Orbyt unifica agenda, clientes, facturación y servicios en una plataforma 
              moderna diseñada para profesionales hispanohablantes que buscan 
              <strong>eficiencia y crecimiento</strong>.
            </p>
            
            <div class="hero-stats">
              <div class="stat">
                <span class="stat-number">1,500+</span>
                <span class="stat-label">Profesionales</span>
              </div>
              <div class="stat">
                <span class="stat-number">50k+</span>
                <span class="stat-label">Citas Gestionadas</span>
              </div>
              <div class="stat">
                <span class="stat-number">98%</span>
                <span class="stat-label">Satisfacción</span>
              </div>
            </div>

            <div class="hero-actions">
              <a routerLink="/auth/registro" class="btn btn-primary btn-lg">
                <i class="pi pi-play-circle"></i>
                Prueba Gratis 14 Días
              </a>
              <button class="btn btn-secondary btn-lg" (click)="playDemo()">
                <i class="pi pi-play"></i>
                Ver Demo (2 min)
              </button>
            </div>

            <div class="hero-trust">
              <p class="trust-text">Únete a profesionales de toda España y Latinoamérica</p>
              <div class="trust-badges">
                <div class="trust-badge">
                  <i class="pi pi-shield-fill"></i>
                  <span>Datos Seguros</span>
                </div>
                <div class="trust-badge">
                  <i class="pi pi-clock"></i>
                  <span>Soporte 24/7</span>
                </div>
                <div class="trust-badge">
                  <i class="pi pi-credit-card"></i>
                  <span>Sin Compromiso</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Hero Image/Dashboard Preview -->
          <div class="hero-image" [@fadeInRight]>
            <div class="dashboard-preview">
              <div class="browser-mockup">
                <div class="browser-bar">
                  <div class="browser-dots">
                    <span class="dot red"></span>
                    <span class="dot yellow"></span>
                    <span class="dot green"></span>
                  </div>
                  <div class="browser-url">app.orbyt.com</div>
                </div>
                <div class="browser-content">
                  <img 
                    src="/assets/images/dashboard-preview.png" 
                    alt="Orbyt Dashboard Preview"
                    class="dashboard-img"
                    loading="eager">
                </div>
              </div>
              
              <!-- Floating Cards -->
              <div class="floating-card card-1" [@float]>
                <div class="card-icon">📅</div>
                <div class="card-content">
                  <h4>Próxima Cita</h4>
                  <p>Dr. García - 10:30</p>
                </div>
              </div>
              
              <div class="floating-card card-2" [@float]>
                <div class="card-icon">💰</div>
                <div class="card-content">
                  <h4>Ingresos Hoy</h4>
                  <p>€1,250</p>
                </div>
              </div>
              
              <div class="floating-card card-3" [@float]>
                <div class="card-icon">✅</div>
                <div class="card-content">
                  <h4>Facturas Enviadas</h4>
                  <p>12 de 12</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scroll Indicator -->
        <div class="scroll-indicator" [@bounce]>
          <div class="scroll-text">Descubre más</div>
          <div class="scroll-arrow">
            <i class="pi pi-angle-down"></i>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./hero-section.component.scss'],
  animations: [
    trigger('fadeInUp', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(30px)'
      })),
      transition('void => *', [
        animate('800ms ease-out')
      ])
    ]),
    trigger('fadeInRight', [
      state('void', style({
        opacity: 0,
        transform: 'translateX(30px)'
      })),
      transition('void => *', [
        animate('800ms 200ms ease-out')
      ])
    ]),
    trigger('float', [
      state('*', style({
        transform: 'translateY(0px)'
      })),
      transition('* => *', [
        animate('3s ease-in-out', style({
          transform: 'translateY(-10px)'
        })),
        animate('3s ease-in-out', style({
          transform: 'translateY(0px)'
        }))
      ])
    ]),
    trigger('bounce', [
      state('*', style({
        transform: 'translateY(0px)'
      })),
      transition('* => *', [
        animate('2s ease-in-out', style({
          transform: 'translateY(-5px)'
        })),
        animate('2s ease-in-out', style({
          transform: 'translateY(0px)'
        }))
      ])
    ])
  ]
})
export class HeroSectionComponent implements OnInit {

  ngOnInit(): void {
    // Start floating animations after component loads
    setTimeout(() => {
      this.startFloatingAnimation();
    }, 1000);
  }

  playDemo(): void {
    // TODO: Open video modal or redirect to demo page
    console.log('Playing demo video');
    // For now, redirect to demo page
    window.open('/demo', '_blank');
  }

  private startFloatingAnimation(): void {
    // Animation is handled by Angular Animations
    // This method can be used for additional JavaScript animations if needed
  }
}