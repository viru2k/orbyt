import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrbitLandingApiService } from '../../services/orbyt-landing-api.service';

interface ContactForm {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  leadType: 'demo' | 'general' | 'support' | 'sales';
  newsletter: boolean;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="contact-page">
      <div class="container">
        <!-- Hero Section -->
        <div class="contact-hero">
          <h1>¿Tienes preguntas? Estamos aquí para ayudarte</h1>
          <p>
            Nuestro equipo de expertos está listo para responder todas tus dudas
            y ayudarte a encontrar la solución perfecta para tu negocio.
          </p>
        </div>

        <div class="contact-content">
          <!-- Contact Info -->
          <div class="contact-info">
            <div class="info-card">
              <div class="info-icon">
                <i class="pi pi-phone"></i>
              </div>
              <h3>Teléfono</h3>
              <p>+34 900 123 456</p>
              <span>Lunes a Viernes, 9:00 - 18:00</span>
            </div>

            <div class="info-card">
              <div class="info-icon">
                <i class="pi pi-envelope"></i>
              </div>
              <h3>Email</h3>
              <p>hola@orbyt.es</p>
              <span>Respuesta en menos de 2 horas</span>
            </div>

            <div class="info-card">
              <div class="info-icon">
                <i class="pi pi-calendar"></i>
              </div>
              <h3>Agendar Demo</h3>
              <p>Videollamada personalizada</p>
              <span>15-30 minutos</span>
            </div>

            <div class="info-card">
              <div class="info-icon">
                <i class="pi pi-comments"></i>
              </div>
              <h3>Chat en Vivo</h3>
              <p>Soporte instantáneo</p>
              <span>Disponible ahora</span>
            </div>
          </div>

          <!-- Contact Form -->
          <div class="contact-form">
            <div class="form-header">
              <h2>Envíanos un mensaje</h2>
              <p>Te responderemos lo antes posible</p>
            </div>

            <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="contact-form-container">
              <!-- Lead Type Selection -->
              <div class="form-group form-group-full">
                <label>¿En qué podemos ayudarte?</label>
                <div class="lead-type-selector">
                  <button 
                    type="button"
                    class="lead-type-btn"
                    [class.active]="contactForm.get('leadType')?.value === 'demo'"
                    (click)="selectLeadType('demo')"
                  >
                    <i class="pi pi-play-circle"></i>
                    <span>Solicitar Demo</span>
                  </button>
                  <button 
                    type="button"
                    class="lead-type-btn"
                    [class.active]="contactForm.get('leadType')?.value === 'sales'"
                    (click)="selectLeadType('sales')"
                  >
                    <i class="pi pi-shopping-cart"></i>
                    <span>Información de Ventas</span>
                  </button>
                  <button 
                    type="button"
                    class="lead-type-btn"
                    [class.active]="contactForm.get('leadType')?.value === 'support'"
                    (click)="selectLeadType('support')"
                  >
                    <i class="pi pi-question-circle"></i>
                    <span>Soporte Técnico</span>
                  </button>
                  <button 
                    type="button"
                    class="lead-type-btn"
                    [class.active]="contactForm.get('leadType')?.value === 'general'"
                    (click)="selectLeadType('general')"
                  >
                    <i class="pi pi-info-circle"></i>
                    <span>Consulta General</span>
                  </button>
                </div>
              </div>

              <!-- Personal Information -->
              <div class="form-row">
                <div class="form-group">
                  <label for="name">Nombre completo *</label>
                  <input
                    id="name"
                    type="text"
                    formControlName="name"
                    placeholder="Tu nombre completo"
                    [class.error]="isFieldInvalid('name')"
                  />
                  <div *ngIf="isFieldInvalid('name')" class="error-message">
                    El nombre es obligatorio
                  </div>
                </div>

                <div class="form-group">
                  <label for="email">Email *</label>
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    placeholder="tu@empresa.com"
                    [class.error]="isFieldInvalid('email')"
                  />
                  <div *ngIf="isFieldInvalid('email')" class="error-message">
                    <span *ngIf="contactForm.get('email')?.errors?.['required']">El email es obligatorio</span>
                    <span *ngIf="contactForm.get('email')?.errors?.['email']">Email inválido</span>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="company">Empresa</label>
                  <input
                    id="company"
                    type="text"
                    formControlName="company"
                    placeholder="Nombre de tu empresa"
                  />
                </div>

                <div class="form-group">
                  <label for="phone">Teléfono</label>
                  <input
                    id="phone"
                    type="tel"
                    formControlName="phone"
                    placeholder="+34 600 123 456"
                  />
                </div>
              </div>

              <!-- Message -->
              <div class="form-group form-group-full">
                <label for="message">Mensaje *</label>
                <textarea
                  id="message"
                  formControlName="message"
                  rows="5"
                  placeholder="Cuéntanos más detalles sobre tu consulta..."
                  [class.error]="isFieldInvalid('message')"
                ></textarea>
                <div *ngIf="isFieldInvalid('message')" class="error-message">
                  El mensaje es obligatorio
                </div>
              </div>

              <!-- Newsletter Subscription -->
              <div class="form-group form-group-full">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    formControlName="newsletter"
                  />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">
                    Sí, quiero recibir noticias y consejos sobre gestión de negocios
                  </span>
                </label>
              </div>

              <!-- Submit Button -->
              <div class="form-actions">
                <button 
                  type="submit" 
                  class="submit-btn"
                  [disabled]="isSubmitting() || contactForm.invalid"
                  [class.loading]="isSubmitting()"
                >
                  <span *ngIf="!isSubmitting()" class="btn-content">
                    <i class="pi pi-send"></i>
                    Enviar mensaje
                  </span>
                  <span *ngIf="isSubmitting()" class="btn-loading">
                    <i class="pi pi-spin pi-spinner"></i>
                    Enviando...
                  </span>
                </button>
              </div>

              <!-- Success Message -->
              <div *ngIf="submitSuccess()" class="success-message">
                <i class="pi pi-check-circle"></i>
                <div>
                  <strong>¡Mensaje enviado correctamente!</strong>
                  <p>Te responderemos en un plazo máximo de 2 horas laborables.</p>
                </div>
              </div>

              <!-- Error Message -->
              <div *ngIf="submitError()" class="form-error-message">
                <i class="pi pi-exclamation-triangle"></i>
                <div>
                  <strong>Error al enviar el mensaje</strong>
                  <p>{{ submitError() }}</p>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="contact-faq">
          <h2>Preguntas Frecuentes</h2>
          <div class="faq-grid">
            <div class="faq-item" *ngFor="let faq of faqs">
              <h4>{{ faq.question }}</h4>
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="contact-cta">
          <div class="cta-content">
            <h2>¿Prefieres una demostración en vivo?</h2>
            <p>
              Agenda una videollamada de 15 minutos con nuestro equipo y te 
              mostraremos cómo Orbyt puede transformar la gestión de tu negocio.
            </p>
            <button class="demo-btn" (click)="selectLeadType('demo')">
              <i class="pi pi-video"></i>
              Agendar Demo Gratuita
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private landingApi = inject(OrbitLandingApiService);

  contactForm: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  faqs = [
    {
      question: '¿Cuánto tiempo toma implementar Orbyt?',
      answer: 'La configuración básica toma menos de 5 minutos. La migración completa de datos existentes puede tomar 1-2 días laborables con nuestro soporte.'
    },
    {
      question: '¿Ofrecen formación para mi equipo?',
      answer: 'Sí, incluimos formación personalizada para tu equipo sin costo adicional. También tenemos documentación y videos tutoriales disponibles 24/7.'
    },
    {
      question: '¿Qué incluye el soporte técnico?',
      answer: 'Soporte por email, chat en vivo, y videollamadas cuando sea necesario. Los planes Professional y Enterprise incluyen soporte prioritario.'
    },
    {
      question: '¿Puedo cancelar en cualquier momento?',
      answer: 'Absolutamente. No hay contratos de permanencia. Puedes cancelar tu suscripción en cualquier momento desde tu panel de control.'
    },
    {
      question: '¿Mis datos están seguros?',
      answer: 'Utilizamos encriptación de grado bancario y cumplimos con GDPR. Tus datos están alojados en servidores seguros en España.'
    },
    {
      question: '¿Hay descuentos por pagos anuales?',
      answer: 'Sí, ofrecemos un 20% de descuento en todos los planes si pagas anualmente. El descuento se aplica automáticamente.'
    }
  ];

  constructor() {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      company: [''],
      phone: [''],
      message: ['', [Validators.required]],
      leadType: ['demo'],
      newsletter: [true]
    });
  }

  selectLeadType(type: 'demo' | 'general' | 'support' | 'sales'): void {
    this.contactForm.patchValue({ leadType: type });
    
    // Update message placeholder based on lead type
    const messageControl = this.contactForm.get('message');
    let placeholder = '';
    
    switch (type) {
      case 'demo':
        placeholder = 'Cuéntanos sobre tu negocio y qué te gustaría ver en la demo...';
        break;
      case 'sales':
        placeholder = 'Describe tu negocio y necesidades específicas...';
        break;
      case 'support':
        placeholder = 'Describe el problema técnico que estás experimentando...';
        break;
      case 'general':
        placeholder = 'Cuéntanos tu consulta...';
        break;
    }
    
    // This would require a reference to the textarea element to update placeholder
    // For now, the placeholder remains static in the template
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  async onSubmit(): Promise<void> {
    if (this.contactForm.valid) {
      this.isSubmitting.set(true);
      this.submitSuccess.set(false);
      this.submitError.set(null);

      try {
        const formData: ContactForm = this.contactForm.value;
        
        // Submit lead to API
        await this.landingApi.submitLead(formData).toPromise();
        
        // Subscribe to newsletter if requested
        if (formData.newsletter && formData.email) {
          try {
            await this.landingApi.subscribeNewsletter(formData.email).toPromise();
          } catch (newsletterError) {
            console.warn('Newsletter subscription failed:', newsletterError);
            // Don't fail the entire form for newsletter issues
          }
        }

        this.submitSuccess.set(true);
        this.contactForm.reset();
        this.contactForm.patchValue({ 
          leadType: 'demo',
          newsletter: true 
        });

        // Scroll to success message
        setTimeout(() => {
          const successElement = document.querySelector('.success-message');
          if (successElement) {
            successElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

      } catch (error: any) {
        console.error('Contact form submission failed:', error);
        this.submitError.set(
          error.message || 'Ha ocurrido un error. Por favor, inténtalo de nuevo.'
        );
      } finally {
        this.isSubmitting.set(false);
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }
}