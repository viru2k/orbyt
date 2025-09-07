import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-landing-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="landing-layout">
      <!-- Header/Navigation -->
      <header class="landing-header">
        <nav class="navbar">
          <div class="nav-container">
            <!-- Logo -->
            <div class="nav-brand">
              <a [routerLink]="['/']" class="brand-link">
                <div class="brand-logo"></div>
                <span class="brand-text">Orbyt</span>
              </a>
            </div>

            <!-- Navigation Menu -->
            <div class="nav-menu" [class.active]="isMenuOpen">
              <a href="#features" class="nav-link" (click)="scrollToSection('features')">Funciones</a>
              <a href="#how-it-works" class="nav-link" (click)="scrollToSection('how-it-works')">Cómo funciona</a>
              <a [routerLink]="['/pricing']" class="nav-link" (click)="closeMenu()">Precios</a>
              <a href="#faq" class="nav-link" (click)="scrollToSection('faq')">FAQ</a>
              <a [routerLink]="['/auth/login']" class="nav-link login-link" (click)="closeMenu()">Iniciar Sesión</a>
              <a [routerLink]="['/auth/register']" class="nav-cta" (click)="closeMenu()">Prueba Gratis</a>
            </div>

            <!-- Mobile Menu Toggle -->
            <button class="nav-toggle" (click)="toggleMobileMenu()" [class.active]="isMenuOpen">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </nav>
      </header>

      <!-- Main Content -->
      <main class="landing-main">
        <ng-content></ng-content>
      </main>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-container">
          <div class="footer-grid">
            <!-- Company Info -->
            <div class="footer-section">
              <div class="footer-brand">
                <div class="footer-logo"></div>
                <span class="footer-brand-text">Orbyt</span>
              </div>
              <p class="footer-description">
                La solución integral para gestionar tu negocio. 
                Facturación, agenda, clientes y más en una sola plataforma.
              </p>
              <div class="social-links">
                <a href="#" class="social-link">
                  <i class="pi pi-twitter"></i>
                </a>
                <a href="#" class="social-link">
                  <i class="pi pi-linkedin"></i>
                </a>
                <a href="#" class="social-link">
                  <i class="pi pi-facebook"></i>
                </a>
                <a href="#" class="social-link">
                  <i class="pi pi-instagram"></i>
                </a>
              </div>
            </div>

            <!-- Product -->
            <div class="footer-section">
              <h4 class="footer-title">Producto</h4>
              <ul class="footer-links">
                <li><a href="#features" (click)="scrollToSection('features')">Funciones</a></li>
                <li><a [routerLink]="['/pricing']" class="footer-link">Precios</a></li>
                <li><a href="#how-it-works" (click)="scrollToSection('how-it-works')">Cómo funciona</a></li>
                <li><a href="#testimonials" (click)="scrollToSection('testimonials')">Testimonios</a></li>
              </ul>
            </div>

            <!-- Company -->
            <div class="footer-section">
              <h4 class="footer-title">Empresa</h4>
              <ul class="footer-links">
                <li><a href="#about" (click)="scrollToSection('about')">Acerca de</a></li>
                <li><a href="#contact" (click)="scrollToSection('contact')">Contacto</a></li>
                <li><a [routerLink]="['/auth/register']" class="footer-link">Únete al equipo</a></li>
              </ul>
            </div>

            <!-- Support -->
            <div class="footer-section">
              <h4 class="footer-title">Soporte</h4>
              <ul class="footer-links">
                <li><a href="#faq" (click)="scrollToSection('faq')">Preguntas Frecuentes</a></li>
                <li><a href="#help" (click)="scrollToSection('help')">Centro de Ayuda</a></li>
                <li><a href="#status" (click)="scrollToSection('status')">Estado del Sistema</a></li>
                <li><a href="mailto:soporte@orbyt.com" class="footer-link">Contactar Soporte</a></li>
              </ul>
            </div>
          </div>

          <!-- Footer Bottom -->
          <div class="footer-bottom">
            <div class="footer-copyright">
              <p>&copy; {{ currentYear }} Orbyt. Todos los derechos reservados.</p>
            </div>
            <div class="footer-legal">
              <a href="#" class="legal-link">Política de Privacidad</a>
              <a href="#" class="legal-link">Términos de Servicio</a>
              <a href="#" class="legal-link">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styleUrls: ['./landing-layout.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LandingLayoutComponent {
  isMenuOpen = false;
  currentYear = new Date().getFullYear();

  constructor(private router: Router) {}

  toggleMobileMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  scrollToSection(sectionId: string): void {
    this.isMenuOpen = false; // Close mobile menu
    
    // If we're not on the home page, navigate there first
    if (this.router.url !== '/') {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          this.performScroll(sectionId);
        }, 100);
      });
    } else {
      this.performScroll(sectionId);
    }
  }

  private performScroll(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}