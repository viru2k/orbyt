import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  template: `
    <footer class="landing-footer">
      <!-- Main Footer -->
      <div class="footer-main">
        <div class="container">
          <div class="row">
            <!-- Company Info -->
            <div class="col-lg-4 col-md-6 mb-4">
              <div class="footer-brand">
                <img src="/assets/images/orbyt-logo-white.svg" alt="Orbyt" class="footer-logo">
                <h5>Orbyt</h5>
                <p class="footer-description">
                  La plataforma todo-en-uno que revoluciona la gestión de tu negocio de servicios.
                  Diseñada para profesionales que buscan eficiencia y crecimiento.
                </p>
                <div class="social-links">
                  <a href="https://twitter.com/orbytapp" target="_blank" class="social-link">
                    <i class="pi pi-twitter"></i>
                  </a>
                  <a href="https://linkedin.com/company/orbyt" target="_blank" class="social-link">
                    <i class="pi pi-linkedin"></i>
                  </a>
                  <a href="https://facebook.com/orbytapp" target="_blank" class="social-link">
                    <i class="pi pi-facebook"></i>
                  </a>
                  <a href="https://instagram.com/orbytapp" target="_blank" class="social-link">
                    <i class="pi pi-instagram"></i>
                  </a>
                </div>
              </div>
            </div>

            <!-- Product -->
            <div class="col-lg-2 col-md-6 mb-4">
              <h6 class="footer-title">Producto</h6>
              <ul class="footer-links">
                <li><a routerLink="/funcionalidades">Funcionalidades</a></li>
                <li><a routerLink="/precios">Precios</a></li>
                <li><a routerLink="/demo">Demo Interactivo</a></li>
                <li><a href="/integraciones">Integraciones</a></li>
                <li><a href="/actualizaciones">Novedades</a></li>
                <li><a href="/roadmap">Roadmap</a></li>
              </ul>
            </div>

            <!-- Resources -->
            <div class="col-lg-2 col-md-6 mb-4">
              <h6 class="footer-title">Recursos</h6>
              <ul class="footer-links">
                <li><a routerLink="/recursos/blog">Blog</a></li>
                <li><a routerLink="/recursos/casos-exito">Casos de Éxito</a></li>
                <li><a routerLink="/recursos/webinars">Webinars</a></li>
                <li><a routerLink="/recursos/guias">Guías</a></li>
                <li><a href="/centro-ayuda">Centro de Ayuda</a></li>
                <li><a href="/api-docs">Documentación API</a></li>
              </ul>
            </div>

            <!-- Support -->
            <div class="col-lg-2 col-md-6 mb-4">
              <h6 class="footer-title">Soporte</h6>
              <ul class="footer-links">
                <li><a routerLink="/contacto">Contacto</a></li>
                <li><a href="/soporte">Centro de Soporte</a></li>
                <li><a href="/chat">Chat en Vivo</a></li>
                <li><a href="/comunidad">Comunidad</a></li>
                <li><a href="/estado">Estado del Sistema</a></li>
                <li><a href="/reportar-error">Reportar Error</a></li>
              </ul>
            </div>

            <!-- Newsletter -->
            <div class="col-lg-2 col-md-6 mb-4">
              <h6 class="footer-title">Newsletter</h6>
              <p class="newsletter-description">
                Recibe las últimas novedades, consejos y recursos directamente en tu inbox.
              </p>
              <form class="newsletter-form" (ngSubmit)="subscribeToNewsletter()">
                <div class="input-group">
                  <input 
                    type="email" 
                    [(ngModel)]="newsletterEmail"
                    name="email"
                    placeholder="tu@email.com"
                    class="form-control"
                    required>
                  <button type="submit" class="btn btn-primary">
                    <i class="pi pi-send"></i>
                  </button>
                </div>
                <small class="form-text">
                  Al suscribirte, aceptas recibir emails de marketing. 
                  Puedes darte de baja en cualquier momento.
                </small>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div class="footer-bottom">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-md-6">
              <p class="copyright">
                © {{ currentYear }} Orbyt. Todos los derechos reservados.
              </p>
            </div>
            <div class="col-md-6">
              <ul class="legal-links">
                <li><a routerLink="/legal/privacidad">Política de Privacidad</a></li>
                <li><a routerLink="/legal/terminos">Términos de Servicio</a></li>
                <li><a routerLink="/legal/cookies">Política de Cookies</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Trust Badges -->
      <div class="trust-badges">
        <div class="container">
          <div class="badges-row">
            <div class="trust-badge">
              <i class="pi pi-shield-fill"></i>
              <span>Datos Seguros</span>
            </div>
            <div class="trust-badge">
              <i class="pi pi-check-circle"></i>
              <span>GDPR Compliant</span>
            </div>
            <div class="trust-badge">
              <i class="pi pi-lock"></i>
              <span>SSL Encryption</span>
            </div>
            <div class="trust-badge">
              <i class="pi pi-verified"></i>
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./landing-footer.component.scss']
})
export class LandingFooterComponent {
  newsletterEmail = '';
  currentYear = new Date().getFullYear();

  subscribeToNewsletter(): void {
    if (!this.newsletterEmail) return;
    
    // TODO: Integrate with newsletter service
    console.log('Newsletter subscription:', this.newsletterEmail);
    
    // Show success message
    // TODO: Add proper toast notification
    alert('¡Gracias! Te has suscrito exitosamente a nuestro newsletter.');
    
    this.newsletterEmail = '';
  }
}