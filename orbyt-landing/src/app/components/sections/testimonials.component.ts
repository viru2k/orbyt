import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="testimonials" class="testimonials-section">
      <div class="container">
        <div class="section-header">
          <h2>Lo que dicen nuestros clientes</h2>
          <p>Testimonios reales de profesionales que han transformado su negocio con Orbyt</p>
        </div>
        
        <div class="testimonials-grid">
          <div class="testimonial-card" *ngFor="let testimonial of testimonials">
            <div class="testimonial-content">
              <div class="stars">
                <i class="pi pi-star-fill" *ngFor="let star of [1,2,3,4,5]"></i>
              </div>
              <blockquote>{{ testimonial.quote }}</blockquote>
            </div>
            <div class="testimonial-author">
              <div class="author-avatar">
                <span>{{ testimonial.initials }}</span>
              </div>
              <div class="author-info">
                <h4>{{ testimonial.name }}</h4>
                <span>{{ testimonial.title }}</span>
                <small>{{ testimonial.company }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./testimonials.component.scss']
})
export class TestimonialsComponent {
  testimonials = [
    {
      quote: "Desde que implementamos Orbyt, hemos reducido 60% el tiempo administrativo. Nuestros pacientes pueden reservar online y reciben recordatorios automáticos. Es impresionante la diferencia.",
      name: "Dr. Elena Vázquez",
      title: "Directora Médica",
      company: "Clínica Santa Elena, Madrid",
      initials: "EV"
    },
    {
      quote: "Como peluquera autónoma, Orbyt me ha permitido profesionalizar completamente mi negocio. El control de citas, inventario de productos y facturación en una sola plataforma. Mi facturación subió 35% el primer año.",
      name: "Carmen López",
      title: "Estilista Profesional",
      company: "Salón Carmen, Valencia",
      initials: "CL"
    },
    {
      quote: "Gestiono 3 consultas de psicología con Orbyt. La integración del sistema de tokens para consultas online y la gestión de historiales me ahorra 10 horas semanales. Indispensable para cualquier profesional serio.",
      name: "David Martín",
      title: "Psicólogo Clínico",
      company: "Centro Psicológico Integral, Barcelona",
      initials: "DM"
    },
    {
      quote: "En nuestra clínica veterinaria, Orbyt nos ayuda a gestionar 150+ mascotas con sus historiales, vacunas y citas. Los dueños pueden acceder a la información de sus mascotas fácilmente. Profesional y confiable.",
      name: "Dra. Rosa Fernández",
      title: "Veterinaria",
      company: "Clínica Veterinaria Los Olivos, Sevilla",
      initials: "RF"
    },
    {
      quote: "Como centro de estética, necesitábamos control total de tratamientos, productos y seguimiento de clientes. Orbyt nos da todo eso y más. Sistema de recompensas incluido que aumentó la fidelización en 45%.",
      name: "Isabel García",
      title: "Directora de Centro",
      company: "Estética Avanzada, Bilbao",
      initials: "IG"
    },
    {
      quote: "Para mi despacho de abogados, la gestión de casos, clientes y facturación era un caos. Con Orbyt todo está ordenado, automatizado y profesional. Mis clientes notan la diferencia inmediatamente.",
      name: "Javier Ruiz",
      title: "Abogado Socio",
      company: "Ruiz & Partners Legal, Zaragoza",
      initials: "JR"
    }
  ];
}