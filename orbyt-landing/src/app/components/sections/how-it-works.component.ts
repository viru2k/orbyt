import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section id="how-it-works" class="how-it-works-section">
      <div class="container">
        <div class="section-header">
          <h2>Tu negocio profesional en <span class="highlight">4 pasos simples</span></h2>
          <p>Desde consultorios médicos hasta salones de belleza, configura tu plataforma de gestión profesional en minutos</p>
        </div>
        
        <div class="steps-grid">
          <div class="step-card" *ngFor="let step of steps; let i = index">
            <div class="step-number">{{ i + 1 }}</div>
            <div class="step-content">
              <div class="step-icon">
                <i class="pi" [ngClass]="step.icon"></i>
              </div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
          </div>
        </div>
        
        <div class="cta-container">
          <a [routerLink]="['/auth/register']" class="start-button">
            <i class="pi pi-play"></i>
            Comenzar ahora
          </a>
          <p class="cta-subtitle">Setup completo en menos de 5 minutos</p>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./how-it-works.component.scss']
})
export class HowItWorksComponent {
  steps = [
    {
      title: "Selecciona tu sector",
      description: "Elige tu especialidad: medicina, psicología, belleza, veterinaria, legal, consultoría... Orbyt se adapta automáticamente con templates específicos.",
      icon: "pi-briefcase"
    },
    {
      title: "Configura tu práctica",
      description: "Define tus horarios, salas, servicios y precios. Conecta tu calendario y sistema de pagos. Todo listo en 5 minutos.",
      icon: "pi-cog"
    },
    {
      title: "Importa tus clientes",
      description: "Migra fácilmente desde Excel, Google Sheets o tu sistema actual. Orbyt mantiene todo el historial y datos importantes.",
      icon: "pi-upload"
    },
    {
      title: "Automatiza y crece",
      description: "Reservas online 24/7, recordatorios automáticos, facturación profesional y reportes detallados. Tu negocio trabajando por ti.",
      icon: "pi-chart-line-up"
    }
  ];
}