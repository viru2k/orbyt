import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>Transforma tu práctica profesional <span class="highlight">hoy mismo</span></h2>
          <p>
            Más de <strong>12,000 profesionales</strong> de la salud, belleza, legal y consultoría 
            ya han revolucionado su forma de trabajar con Orbyt. Tu turno de crecer es ahora.
          </p>
          
          <div class="cta-stats">
            <div class="stat-item">
              <span class="stat-number">12K+</span>
              <span class="stat-label">Profesionales confiando</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">2.5M+</span>
              <span class="stat-label">Citas gestionadas</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">€50M+</span>
              <span class="stat-label">Facturación procesada</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">40%</span>
              <span class="stat-label">Más ingresos promedio</span>
            </div>
          </div>
          
          <div class="cta-actions">
            <a [routerLink]="['/auth/register']" class="btn btn-primary">
              <i class="pi pi-rocket"></i>
              Comenzar prueba gratuita
            </a>
            <a [routerLink]="['/pricing']" class="btn btn-secondary">
              <i class="pi pi-calculator"></i>
              Ver planes y precios
            </a>
          </div>
          
          <div class="cta-guarantee">
            <i class="pi pi-shield"></i>
            <span>14 días gratis • Sin compromiso • Cancela cuando quieras</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./cta-section.component.scss']
})
export class CtaSectionComponent {}