import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { TabViewModule } from 'primeng/tabview';

// Orb Components - Using orb-card and orb-button in template
import { 
  OrbCardComponent, 
  OrbButtonComponent
} from '@orb-components';

// Services and Models
import { EmailManagementService } from '../../services/email-management.service';
import { 
  TestEmailRequest, 
  TestEmailResponse, 
  EmailTemplateType 
} from '../../models/email.models';
import { SendEmailDto } from 'src/app/api/models';

interface TestEmailTemplate {
  type: EmailTemplateType;
  name: string;
  subject: string;
  defaultMessage: string;
  variables: string[];
}

@Component({
  selector: 'app-test-email',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToastModule,
    ProgressSpinnerModule,
    DividerModule,
    TabViewModule,
    OrbCardComponent,
    OrbButtonComponent
  ],
  providers: [MessageService],
  template: `
    <div class="test-email-container">
      <orb-card>
        <div orbHeader>
          <h2><i class="fa fa-vial"></i> Probar Envío de Emails</h2>
          <p class="header-subtitle">
            Verifica que el sistema de emails funcione correctamente enviando emails de prueba
          </p>
        </div>

        <div orbBody>
          <div *ngIf="!hasEmailSettings()" class="no-settings-warning">
            <div class="warning-content">
              <i class="fa fa-exclamation-triangle"></i>
              <h3>Configuración Requerida</h3>
              <p>
                Antes de poder probar el envío de emails, debes configurar el servidor SMTP.
              </p>
              <orb-button
                label="Configurar Email"
                icon="fa fa-cog"
                variant="primary"
                (clicked)="navigateToSettings()">
              </orb-button>
            </div>
          </div>

          <div *ngIf="hasEmailSettings()" class="test-email-content">
            <p-tabView>
              <!-- Quick Test Tab -->
              <p-tabPanel header="Prueba Rápida" leftIcon="fa fa-bolt">
                <form [formGroup]="quickTestForm" (ngSubmit)="sendQuickTest()">
                  <div class="form-grid">
                    <div class="form-field">
                      <label for="quickTestEmail">Email de destino *</label>
                      <input 
                        type="email" 
                        id="quickTestEmail"
                        formControlName="email"
                        class="form-control"
                        placeholder="test@example.com"
                        [class.error]="isQuickFieldInvalid('email')">
                      <small class="field-error" *ngIf="isQuickFieldInvalid('email')">
                        Ingresa un email válido
                      </small>
                      <small class="field-help">
                        Email donde se enviará la prueba
                      </small>
                    </div>
                  </div>

                  <div class="form-actions">
                    <orb-button
                      type="submit"
                      label="Enviar Prueba Rápida"
                      icon="fa fa-paper-plane"
                      variant="primary"
                      [disabled]="quickTestForm.invalid || sending()"
                      [loading]="sending()">
                    </orb-button>
                  </div>
                </form>
              </p-tabPanel>

              <!-- Custom Test Tab -->
              <p-tabPanel header="Prueba Personalizada" leftIcon="fa fa-edit">
                <form [formGroup]="customTestForm" (ngSubmit)="sendCustomTest()">
                  <div class="form-grid">
                    <div class="form-field">
                      <label for="customTestEmail">Email de destino *</label>
                      <input 
                        type="email" 
                        id="customTestEmail"
                        formControlName="email"
                        class="form-control"
                        placeholder="test@example.com"
                        [class.error]="isCustomFieldInvalid('email')">
                      <small class="field-error" *ngIf="isCustomFieldInvalid('email')">
                        Ingresa un email válido
                      </small>
                    </div>

                    <div class="form-field">
                      <label for="customSubject">Asunto *</label>
                      <input 
                        type="text" 
                        id="customSubject"
                        formControlName="subject"
                        class="form-control"
                        placeholder="Asunto del email de prueba"
                        [class.error]="isCustomFieldInvalid('subject')">
                      <small class="field-error" *ngIf="isCustomFieldInvalid('subject')">
                        El asunto es requerido
                      </small>
                    </div>
                  </div>

                  <div class="form-field full-width">
                    <label for="customMessage">Mensaje *</label>
                    <textarea 
                      id="customMessage"
                      formControlName="message"
                      class="form-control"
                      rows="6"
                      placeholder="Escribe aquí tu mensaje de prueba..."
                      [class.error]="isCustomFieldInvalid('message')"></textarea>
                    <small class="field-error" *ngIf="isCustomFieldInvalid('message')">
                      El mensaje es requerido
                    </small>
                    <small class="field-help">
                      Puedes usar HTML básico para formatear el mensaje
                    </small>
                  </div>

                  <div class="form-actions">
                    <orb-button
                      type="button"
                      label="Limpiar"
                      icon="fa fa-eraser"
                      variant="secondary"
                      (clicked)="resetCustomForm()">
                    </orb-button>
                    
                    <orb-button
                      type="submit"
                      label="Enviar Email Personalizado"
                      icon="fa fa-paper-plane"
                      variant="primary"
                      [disabled]="customTestForm.invalid || sending()"
                      [loading]="sending()">
                    </orb-button>
                  </div>
                </form>
              </p-tabPanel>

              <!-- Template Test Tab -->
              <p-tabPanel header="Probar Plantillas" leftIcon="fa fa-file-alt">
                <form [formGroup]="templateTestForm" (ngSubmit)="sendTemplateTest()">
                  <div class="form-grid">
                    <div class="form-field">
                      <label for="templateTestEmail">Email de destino *</label>
                      <input 
                        type="email" 
                        id="templateTestEmail"
                        formControlName="email"
                        class="form-control"
                        placeholder="test@example.com"
                        [class.error]="isTemplateFieldInvalid('email')">
                      <small class="field-error" *ngIf="isTemplateFieldInvalid('email')">
                        Ingresa un email válido
                      </small>
                    </div>

                    <div class="form-field">
                      <label for="templateType">Tipo de plantilla *</label>
                      <select 
                        id="templateType"
                        formControlName="templateType"
                        class="form-control"
                        [class.error]="isTemplateFieldInvalid('templateType')"
                        (change)="onTemplateChange()">
                        <option value="">Selecciona una plantilla</option>
                        <option 
                          *ngFor="let template of emailTemplates" 
                          [value]="template.type">
                          {{ template.name }}
                        </option>
                      </select>
                      <small class="field-error" *ngIf="isTemplateFieldInvalid('templateType')">
                        Selecciona un tipo de plantilla
                      </small>
                    </div>
                  </div>

                  <div class="template-preview" *ngIf="selectedTemplate()">
                    <h4>Preview de la Plantilla: {{ selectedTemplate()?.name }}</h4>
                    <div class="template-info">
                      <p><strong>Asunto:</strong> {{ selectedTemplate()?.subject }}</p>
                      <p><strong>Variables disponibles:</strong> 
                        <code *ngFor="let variable of selectedTemplate()?.variables; let last = last">
                          {{ '{{' + variable + '}}' }}<span *ngIf="!last">, </span>
                        </code>
                      </p>
                      <div class="template-content">
                        <strong>Contenido:</strong>
                        <div class="content-preview" [innerHTML]="selectedTemplate()?.defaultMessage"></div>
                      </div>
                    </div>
                  </div>

                  <div class="form-actions">
                    <orb-button
                      type="submit"
                      label="Probar Plantilla"
                      icon="fa fa-file-alt"
                      variant="primary"
                      [disabled]="templateTestForm.invalid || sending() || !selectedTemplate()"
                      [loading]="sending()">
                    </orb-button>
                  </div>
                </form>
              </p-tabPanel>
            </p-tabView>
          </div>
        </div>
      </orb-card>

      <!-- Test Results -->
      <orb-card *ngIf="testResults().length > 0">
        <div orbHeader>
          <h3>
            <i class="fa fa-history"></i>
            Resultados de Pruebas ({{ testResults().length }})
          </h3>
          <orb-button
            label="Limpiar Historial"
            icon="fa fa-trash"
            variant="secondary"
            size="small"
            (clicked)="clearResults()">
          </orb-button>
        </div>
        <div orbBody>
          <div class="test-results-list">
            <div 
              *ngFor="let result of testResults(); let i = index" 
              class="test-result-item"
              [class.success]="result.success"
              [class.error]="!result.success">
              
              <div class="result-header">
                <div class="result-status">
                  <i [class]="result.success ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
                  <span class="status-text">
                    {{ result.success ? 'Enviado' : 'Error' }}
                  </span>
                </div>
                <div class="result-time">
                  {{ formatDate(result.timestamp) }}
                </div>
              </div>

              <div class="result-details">
                <p><strong>Destinatario:</strong> {{ result.to }}</p>
                <p *ngIf="result.subject"><strong>Asunto:</strong> {{ result.subject }}</p>
                <p *ngIf="result.messageId && result.success">
                  <strong>ID del mensaje:</strong> 
                  <code>{{ result.messageId }}</code>
                </p>
                <p *ngIf="result.error && !result.success" class="error-message">
                  <strong>Error:</strong> {{ result.error }}
                </p>
              </div>

              <div class="result-actions">
                <orb-button
                  *ngIf="!result.success"
                  label="Reintentar"
                  icon="fa fa-redo"
                  size="small"
                  variant="secondary"
                  (clicked)="retryTest(result)">
                </orb-button>
              </div>
            </div>
          </div>
        </div>
      </orb-card>
    </div>

    <p-toast></p-toast>
  `,
  styleUrls: ['./test-email.component.scss']
})
export class TestEmailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private emailService = inject(EmailManagementService);
  private messageService = inject(MessageService);

  // State signals
  sending = signal(false);
  testResults = signal<Array<TestEmailResponse & { to: string; subject?: string }>>([]);
  selectedTemplate = signal<TestEmailTemplate | null>(null);

  // Form groups
  quickTestForm!: FormGroup;
  customTestForm!: FormGroup;
  templateTestForm!: FormGroup;

  // Email templates for testing
  emailTemplates: TestEmailTemplate[] = [
    {
      type: EmailTemplateType.WELCOME,
      name: 'Email de Bienvenida',
      subject: '¡Bienvenido a Orbyt!',
      defaultMessage: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>¡Hola {{firstName}}!</h2>
          <p>Bienvenido a Orbyt. Tu cuenta ha sido creada exitosamente.</p>
          <p><strong>Email:</strong> {{email}}</p>
          <p><strong>Contraseña temporal:</strong> {{tempPassword}}</p>
          <p>Por favor, cambia tu contraseña en el primer inicio de sesión.</p>
          <a href="{{loginUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Iniciar Sesión
          </a>
        </div>
      `,
      variables: ['firstName', 'email', 'tempPassword', 'loginUrl']
    },
    {
      type: EmailTemplateType.PASSWORD_RESET,
      name: 'Recuperación de Contraseña',
      subject: 'Restablece tu contraseña - Orbyt',
      defaultMessage: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Restablece tu contraseña</h2>
          <p>Hola {{firstName}},</p>
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <a href="{{resetLink}}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Restablecer Contraseña
          </a>
          <p><small>Este enlace expira en 1 hora.</small></p>
          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
        </div>
      `,
      variables: ['firstName', 'resetLink']
    },
    {
      type: EmailTemplateType.SECURITY_ALERT,
      name: 'Alerta de Seguridad',
      subject: '🚨 Alerta de Seguridad - Orbyt',
      defaultMessage: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border-left: 4px solid #dc3545;">
          <h2 style="color: #dc3545;">Alerta de Seguridad</h2>
          <p>Hola {{firstName}},</p>
          <p>Hemos detectado {{failedAttempts}} intentos fallidos de acceso a tu cuenta.</p>
          <p><strong>Fecha:</strong> {{timestamp}}</p>
          <p><strong>IP:</strong> {{ipAddress}}</p>
          <p>Si no fuiste tú, te recomendamos cambiar tu contraseña inmediatamente.</p>
          <p>Si tienes problemas, contacta a nuestro soporte: {{supportEmail}}</p>
        </div>
      `,
      variables: ['firstName', 'failedAttempts', 'timestamp', 'ipAddress', 'supportEmail']
    },
    {
      type: EmailTemplateType.PASSWORD_CHANGED,
      name: 'Contraseña Cambiada',
      subject: 'Contraseña actualizada exitosamente - Orbyt',
      defaultMessage: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #28a745;">✅ Contraseña Actualizada</h2>
          <p>Hola {{firstName}},</p>
          <p>Tu contraseña ha sido cambiada exitosamente.</p>
          <p><strong>Fecha del cambio:</strong> {{changeDate}}</p>
          <p>Si no realizaste este cambio, contacta inmediatamente a soporte.</p>
          <p><strong>Soporte:</strong> {{supportEmail}}</p>
        </div>
      `,
      variables: ['firstName', 'changeDate', 'supportEmail']
    },
    {
      type: EmailTemplateType.ACCOUNT_LOCKOUT,
      name: 'Cuenta Bloqueada',
      subject: '🔒 Cuenta Temporalmente Bloqueada - Orbyt',
      defaultMessage: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border-left: 4px solid #ffc107;">
          <h2 style="color: #ffc107;">Cuenta Temporalmente Bloqueada</h2>
          <p>Hola {{firstName}},</p>
          <p>Tu cuenta ha sido temporalmente bloqueada por seguridad debido a múltiples intentos fallidos de acceso.</p>
          <p><strong>Bloqueado desde:</strong> {{lockoutTime}}</p>
          <p><strong>Se desbloqueará:</strong> {{unlockTime}}</p>
          <p><strong>Intentos fallidos:</strong> {{failedAttempts}}</p>
          <p>Para más información, contacta a soporte: {{supportEmail}}</p>
        </div>
      `,
      variables: ['firstName', 'lockoutTime', 'unlockTime', 'failedAttempts', 'supportEmail']
    }
  ];

  ngOnInit(): void {
    this.initializeForms();
    this.checkEmailSettings();
  }

  private initializeForms(): void {
    // Quick test form
    this.quickTestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Custom test form
    this.customTestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      subject: ['Prueba de Email - Orbyt', Validators.required],
      message: ['Este es un email de prueba enviado desde el sistema Orbyt para verificar que la configuración SMTP funciona correctamente.', Validators.required]
    });

    // Template test form
    this.templateTestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      templateType: ['', Validators.required]
    });
  }

  private checkEmailSettings(): void {
    this.emailService.emailSettings$.subscribe(settings => {
      // Settings loaded, component will react to this
    });
  }

  hasEmailSettings(): boolean {
    return !!this.emailService.getCurrentSettings()?.id;
  }

  navigateToSettings(): void {
    // Navigate to email settings - implement based on your routing
    // this.router.navigate(['/email-settings']);
    this.messageService.add({
      severity: 'info',
      summary: 'Navegación',
      detail: 'Redirigiendo a configuración de email...'
    });
  }

  // Quick test methods
  isQuickFieldInvalid(fieldName: string): boolean {
    const field = this.quickTestForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  async sendQuickTest(): Promise<void> {
    if (this.quickTestForm.invalid) {
      this.markFormGroupTouched(this.quickTestForm);
      return;
    }

    const email = this.quickTestForm.get('email')?.value;
    
    await this.performTest({
      to: email,
      subject: 'Prueba Rápida - Orbyt',
      message: 'Este es un email de prueba rápida enviado desde Orbyt para verificar la configuración SMTP.'
    });
  }

  // Custom test methods
  isCustomFieldInvalid(fieldName: string): boolean {
    const field = this.customTestForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  async sendCustomTest(): Promise<void> {
    if (this.customTestForm.invalid) {
      this.markFormGroupTouched(this.customTestForm);
      return;
    }

    const formValue = this.customTestForm.value;
    
    await this.performTest({
      to: formValue.email,
      subject: formValue.subject,
      message: formValue.message
    });
  }

  resetCustomForm(): void {
    this.customTestForm.reset({
      email: '',
      subject: 'Prueba de Email - Orbyt',
      message: 'Este es un email de prueba enviado desde el sistema Orbyt para verificar que la configuración SMTP funciona correctamente.'
    });
  }

  // Template test methods
  isTemplateFieldInvalid(fieldName: string): boolean {
    const field = this.templateTestForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  onTemplateChange(): void {
    const templateType = this.templateTestForm.get('templateType')?.value;
    const template = this.emailTemplates.find(t => t.type === templateType);
    this.selectedTemplate.set(template || null);
  }

  async sendTemplateTest(): Promise<void> {
    if (this.templateTestForm.invalid || !this.selectedTemplate()) {
      this.markFormGroupTouched(this.templateTestForm);
      return;
    }

    const email = this.templateTestForm.get('email')?.value;
    const template = this.selectedTemplate()!;
    
    // Replace variables with sample data
    let message = template.defaultMessage;
    template.variables.forEach(variable => {
      const sampleValue = this.getSampleValueForVariable(variable);
      message = message.replace(new RegExp(`{{${variable}}}`, 'g'), sampleValue);
    });

    await this.performTest({
      to: email,
      subject: template.subject,
      message: message
    });
  }

  private getSampleValueForVariable(variable: string): string {
    const sampleData: { [key: string]: string } = {
      firstName: 'Juan',
      email: 'juan@example.com',
      tempPassword: 'Temp123!',
      loginUrl: window.location.origin + '/login',
      resetLink: window.location.origin + '/reset-password?token=sample123',
      timestamp: new Date().toLocaleString('es-ES'),
      ipAddress: '192.168.1.100',
      supportEmail: 'soporte@orbyt.com',
      changeDate: new Date().toLocaleString('es-ES'),
      lockoutTime: new Date().toLocaleString('es-ES'),
      unlockTime: new Date(Date.now() + 60 * 60 * 1000).toLocaleString('es-ES'), // 1 hour later
      failedAttempts: '5'
    };
    
    return sampleData[variable] || `[${variable}]`;
  }

  // Common test execution method
  private async performTest(request: TestEmailRequest & { to: string }): Promise<void> {
    this.sending.set(true);

    try {
      const sendRequest: SendEmailDto = {
        to: [request.to],
        subject: request.subject || 'Email de prueba - Orbyt',
        htmlContent: request.message || 'Este es un email de prueba.'
      };
      const response = await this.emailService.sendTestEmail(sendRequest).toPromise();
      
      if (response) {
        const resultWithContext = {
          ...response,
          to: request.to,
          subject: request.subject,
          timestamp: new Date().toISOString()
        };
        
        // Add to results at the beginning of the array
        this.testResults.update(results => [resultWithContext, ...results]);

        if (response.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Email enviado',
            detail: `Email de prueba enviado exitosamente a ${request.to}`
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error al enviar',
            detail: response.error || 'Error desconocido'
          });
        }
      }
    } catch (error: any) {
      console.error('Test email error:', error);
      
      const errorResult = {
        success: false,
        error: error?.message || 'Error al enviar email de prueba',
        timestamp: new Date().toISOString(),
        to: request.to,
        subject: request.subject
      };
      
      this.testResults.update(results => [errorResult, ...results]);
      
      this.messageService.add({
        severity: 'error',
        summary: 'Error de prueba',
        detail: 'No se pudo enviar el email de prueba'
      });
    } finally {
      this.sending.set(false);
    }
  }

  // Results management
  clearResults(): void {
    this.testResults.set([]);
    this.messageService.add({
      severity: 'info',
      summary: 'Historial limpiado',
      detail: 'Se han eliminado todos los resultados de prueba'
    });
  }

  async retryTest(result: TestEmailResponse & { to: string; subject?: string }): Promise<void> {
    await this.performTest({
      to: result.to,
      subject: result.subject || 'Reenvío de Prueba - Orbyt',
      message: 'Este es un reenvío de la prueba de email anterior.'
    });
  }

  // Utility methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}