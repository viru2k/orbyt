import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="faq" class="faq-section">
      <div class="container">
        <div class="section-header">
          <h2>Preguntas Frecuentes</h2>
          <p>Resolvemos tus dudas sobre Orbyt y cómo puede ayudarte</p>
        </div>
        
        <div class="faq-list">
          <div class="faq-item" *ngFor="let faq of faqs; let i = index">
            <div class="faq-question" (click)="toggleFaq(i)">
              <h3>{{ faq.question }}</h3>
              <i class="pi" [ngClass]="isOpen(i) ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
            </div>
            <div class="faq-answer" [class.open]="isOpen(i)">
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
        
        <div class="faq-cta">
          <p>¿No encuentras la respuesta que buscas?</p>
          <a href="mailto:soporte@orbyt.com" class="contact-button">
            <i class="pi pi-envelope"></i>
            Contactar Soporte
          </a>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./faq-section.component.scss']
})
export class FaqSectionComponent {
  openItems = signal<number[]>([]);
  
  faqs = [
    {
      question: "¿Cómo empiezo con Orbyt?",
      answer: "Es muy simple. Regístrate, elige tu plan, configura tu perfil empresarial y empieza a agregar clientes. El proceso completo toma menos de 5 minutos."
    },
    {
      question: "¿Puedo cambiar de plan en cualquier momento?",
      answer: "Sí, puedes actualizar o reducir tu plan cuando quieras desde tu panel de control. Los cambios se aplican inmediatamente y se reflejan en tu próxima facturación."
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Aceptamos tarjetas de crédito y débito, PayPal, y transferencias bancarias. También estamos integrando Bizum para mayor comodidad en España."
    },
    {
      question: "¿Mis datos están seguros?",
      answer: "Absolutamente. Utilizamos encriptación de grado bancario, cumplimos con GDPR, y realizamos copias de seguridad diarias. Tus datos están completamente protegidos."
    },
    {
      question: "¿Puedo importar mis clientes existentes?",
      answer: "Sí, ofrecemos herramientas de importación desde Excel, Google Sheets, y otros sistemas de gestión. También puedes sincronizar con tu agenda de Google o Outlook."
    },
    {
      question: "¿Hay límite en el número de facturas?",
      answer: "No hay límites en las facturas que puedes crear. Solo limitamos el número de clientes según tu plan. Las facturas son ilimitadas en todos los planes."
    },
    {
      question: "¿Ofrecen soporte técnico?",
      answer: "Todos los planes incluyen soporte por email. Los planes Professional y Enterprise tienen soporte prioritario y chat en vivo. Enterprise incluye soporte telefónico."
    },
    {
      question: "¿Puedo cancelar mi suscripción?",
      answer: "Por supuesto. Puedes cancelar en cualquier momento sin penalizaciones. Tu cuenta permanecerá activa hasta el final del período ya pagado."
    }
  ];
  
  isOpen(index: number): boolean {
    return this.openItems().includes(index);
  }
  
  toggleFaq(index: number): void {
    const current = this.openItems();
    if (current.includes(index)) {
      this.openItems.set(current.filter(i => i !== index));
    } else {
      this.openItems.set([...current, index]);
    }
  }
}