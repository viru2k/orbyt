import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';

// Orb Components - Using orb-card and orb-button in template
import {
  OrbCardComponent,
  OrbButtonComponent,
  OrbFormFieldComponent,
  OrbTextInputComponent,
  OrbCheckboxComponent,
} from '@orb-components';

// Services and Models
import { EmailManagementService } from '../../services/email-management.service';
import { EmailSettings, EmailProvider, SMTP_PRESETS } from '../../models/email.models';
import {
  EmailSettingsDto,
  TestConnectionResponseDto,
  SendEmailDto,
  EmailSendResponseDto,
  UpdateEmailSettingsDto,
  EmailSettingsResponseDto,
} from 'src/app/api/models';

@Component({
  selector: 'app-email-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    ToastModule,
    ProgressSpinnerModule,
    DividerModule,
    OrbCardComponent,
    OrbButtonComponent,
    OrbFormFieldComponent,
    OrbTextInputComponent,
    OrbCheckboxComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="email-settings-container">
      <orb-card>
        <div orbHeader>
          <h2><i class="fa fa-envelope-o"></i> Configuración de Email</h2>
          <p class="header-subtitle">
            Configura el servidor SMTP para el envío de correos electrónicos
          </p>
        </div>

        <div orbBody>
          <div *ngIf="loading()" class="loading-container">
            <p-progressSpinner [style]="{ width: '40px', height: '40px' }"></p-progressSpinner>
            <p>Cargando configuración...</p>
          </div>

          <form [formGroup]="settingsForm" (ngSubmit)="onSubmit()" *ngIf="!loading()">
            <!-- Provider Selection -->
            <div class="form-section">
              <h3>Proveedor de Email</h3>
              <div class="provider-grid">
                <div
                  *ngFor="let provider of providerOptions"
                  class="provider-card"
                  [class.selected]="settingsForm.get('provider')?.value === provider.value"
                  (click)="selectProvider(provider.value)"
                >
                  <i [class]="provider.icon"></i>
                  <span>{{ provider.label }}</span>
                </div>
              </div>
            </div>

            <p-divider></p-divider>

            <!-- SMTP Configuration -->
            <div class="form-section">
              <h3>Configuración SMTP</h3>
              <div class="form-grid">
                <div class="form-field">
                  <orb-form-field label="Servidor SMTP" [required]="true">
                    <orb-text-input
                      inputId="host"
                      formControlName="host"
                      placeholder="smtp.gmail.com"
                    >
                    </orb-text-input>
                  </orb-form-field>
                </div>

                <div class="form-field">
                  <orb-form-field label="Puerto" [required]="true">
                    <p-inputNumber
                      inputId="port"
                      formControlName="port"
                      [min]="1"
                      [max]="65535"
                      [step]="1"
                      mode="decimal"
                      styleClass="w-full"
                    >
                    </p-inputNumber>
                  </orb-form-field>
                </div>

                <div class="form-field checkbox-field">
                  <orb-checkbox
                    inputId="secure"
                    formControlName="secure"
                    label="Conexión segura (SSL/TLS)"
                    [binary]="true"
                  >
                  </orb-checkbox>
                  <small class="field-help">Recomendado para producción</small>
                </div>
              </div>
            </div>

            <p-divider></p-divider>

            <!-- Authentication -->
            <div class="form-section">
              <h3>Autenticación</h3>
              <div class="form-grid">
                <div class="form-field">
                  <orb-form-field label="Usuario/Email" [required]="true">
                    <orb-text-input
                      inputId="user"
                      formControlName="user"
                      type="email"
                      placeholder="your-email@gmail.com"
                    >
                    </orb-text-input>
                  </orb-form-field>
                </div>

                <div class="form-field">
                  <orb-form-field label="Contraseña/App Password" [required]="true">
                    <orb-text-input
                      inputId="password"
                      formControlName="password"
                      [type]="showPassword() ? 'text' : 'password'"
                      placeholder="••••••••••••"
                    >
                    </orb-text-input>
                  </orb-form-field>
                  <button type="button" class="password-toggle" (click)="togglePassword()">
                    <i [class]="showPassword() ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
                  </button>
                  <small class="field-error" *ngIf="isFieldInvalid('password')">
                    La contraseña es requerida
                  </small>
                  <small class="field-help">
                    Para Gmail, usa App Passwords en lugar de tu contraseña normal
                  </small>
                </div>
              </div>
            </div>

            <p-divider></p-divider>

            <!-- Email Configuration -->
            <div class="form-section">
              <h3>Configuración de Emails</h3>
              <div class="form-grid">
                <div class="form-field">
                  <orb-form-field label="Email remitente" [required]="true">
                    <orb-text-input
                      inputId="from"
                      formControlName="from"
                      type="email"
                      placeholder='"Orbyt Support" <noreply@orbyt.com>'
                    >
                    </orb-text-input>
                    <small class="field-help">
                      Formato: "Nombre" &lt;email&#64;dominio.com&gt; o email&#64;dominio.com
                    </small>
                  </orb-form-field>
                </div>

                <div class="form-field">
                  <orb-form-field label="Email de soporte" [required]="true">
                    <orb-text-input
                      inputId="supportEmail"
                      formControlName="supportEmail"
                      type="email"
                      placeholder="soporte@orbyt.com"
                    >
                    </orb-text-input>
                  </orb-form-field>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="form-actions">
              <orb-button
                type="button"
                label="Probar Configuración"
                icon="fa fa-vial"
                severity="secondary"
                variant="outlined"
                [disabled]="settingsForm.invalid || saving()"
                (clicked)="testConfiguration()"
              >
              </orb-button>

              <orb-button
                type="submit"
                label="Guardar Configuración"
                icon="fa fa-save"
                severity="info"
                variant="outlined"
                [disabled]="settingsForm.invalid || saving()"
                [loading]="saving()"
              >
              </orb-button>
            </div>
          </form>
        </div>
      </orb-card>

      <!-- Test Results Card -->
      <orb-card *ngIf="testResult()">
        <div orbHeader>
          <h3>
            <i
              [class]="
                testResult()?.success
                  ? 'fa fa-check-circle text-success'
                  : 'fa fa-times-circle text-danger'
              "
            ></i>
            Resultado de la Prueba
          </h3>
        </div>
        <div orbBody>
          <div class="test-result" [class]="testResult()?.success ? 'success' : 'error'">
            <p *ngIf="testResult()?.success" class="success-message">
              <strong>✅ Configuración válida</strong><br />
              El servidor SMTP está configurado correctamente y puede enviar emails.
              <span *ngIf="testResult()?.messageId">
                <br /><small>ID del mensaje: {{ testResult()?.messageId }}</small>
              </span>
            </p>
            <p *ngIf="!testResult()?.success" class="error-message">
              <strong>❌ Error en la configuración</strong><br />
              {{ testResult()?.error || 'Error desconocido al probar la configuración.' }}
            </p>
            <small class="timestamp">
              Probado el: {{ formatDate(testResult()?.timestamp || '') }}
            </small>
          </div>
        </div>
      </orb-card>
    </div>

    <p-toast></p-toast>
  `,
  styleUrls: ['./email-settings.component.scss'],
})
export class EmailSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private emailService = inject(EmailManagementService);
  private messageService = inject(MessageService);

  // State signals
  loading = signal(false);
  saving = signal(false);
  showPassword = signal(false);
  testResult = signal<{
    success: boolean;
    error?: string;
    messageId?: string;
    timestamp: string;
  } | null>(null);
  currentSettings = signal<EmailSettingsResponseDto | null>(null);

  settingsForm!: FormGroup;

  // Provider options for selection
  providerOptions = [
    {
      value: EmailProvider.GMAIL,
      label: 'Gmail',
      icon: 'fab fa-google',
    },
    {
      value: EmailProvider.OUTLOOK,
      label: 'Outlook',
      icon: 'fab fa-microsoft',
    },
    {
      value: EmailProvider.YAHOO,
      label: 'Yahoo',
      icon: 'fab fa-yahoo',
    },
    {
      value: EmailProvider.SENDGRID,
      label: 'SendGrid',
      icon: 'fa fa-paper-plane',
    },
    {
      value: EmailProvider.MAILGUN,
      label: 'Mailgun',
      icon: 'fa fa-envelope',
    },
    {
      value: EmailProvider.CUSTOM,
      label: 'Personalizado',
      icon: 'fa fa-cog',
    },
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentSettings();
  }

  private initializeForm(): void {
    this.settingsForm = this.fb.group({
      provider: [EmailProvider.GMAIL, Validators.required],
      host: ['', Validators.required],
      port: [587, [Validators.required, Validators.min(1), Validators.max(65535)]],
      secure: [false],
      user: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      from: ['', Validators.required],
      supportEmail: ['', [Validators.required, Validators.email]],
    });

    // Set initial provider preset
    this.selectProvider(EmailProvider.GMAIL);
  }

  private loadCurrentSettings(): void {
    this.loading.set(true);

    this.emailService.getEmailSettings().subscribe({
      next: (apiSettings) => {
        // Convert API response to frontend model
        const settings: EmailSettings = {
          id: parseInt(apiSettings.id || '0'),
          host: apiSettings.smtpHost || '',
          port: apiSettings.smtpPort || 587,
          secure: apiSettings.smtpSecure || false,
          user: apiSettings.smtpUser || '',
          password: apiSettings.smtpPassword || '',
          from: apiSettings.fromEmail || '',
          supportEmail: apiSettings.replyToEmail || apiSettings.fromEmail || '',
          isActive: apiSettings.isActive ?? false,
          provider: (apiSettings.provider as any) || 'custom',
        };
        this.currentSettings.set(apiSettings);
        this.populateForm(settings);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading email settings:', error);
        this.loading.set(false);
        // If no settings exist, keep default form values
      },
    });
  }

  private populateForm(settings: EmailSettings): void {
    this.settingsForm.patchValue({
      provider: settings.provider,
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      user: settings.user,
      password: '', // Don't populate password for security
      from: settings.from,
      supportEmail: settings.supportEmail,
    });
  }

  selectProvider(provider: EmailProvider): void {
    const preset = SMTP_PRESETS[provider];

    this.settingsForm.patchValue({
      provider,
      host: preset.host,
      port: preset.port,
      secure: preset.secure,
    });

    // Clear test result when provider changes
    this.testResult.set(null);
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.settingsForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  async testConfiguration(): Promise<void> {
    if (this.settingsForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    this.loading.set(true);
    this.testResult.set(null);

    const formValues = this.settingsForm.value;

    try {
      // First validate SMTP settings
      const validation = await this.emailService.validateSmtpSettings(formValues).toPromise();

      if (!validation?.success) {
        this.testResult.set({
          success: false,
          error: validation?.error || 'Configuración SMTP inválida',
          timestamp: new Date().toISOString(),
        });
        this.loading.set(false);
        return;
      }

      // If validation passes, send a test email
      const testResponse = await this.emailService
        .sendTestEmail({
          to: [formValues.user], // Send test to the configured user email
          subject: 'Prueba de configuración SMTP - Orbyt',
          htmlContent: 'Este es un email de prueba para verificar la configuración SMTP.',
        })
        .toPromise();

      this.testResult.set({
        success: testResponse?.success || false,
        error: testResponse?.error,
        messageId: testResponse?.messageId,
        timestamp: new Date().toISOString(),
      });

      if (testResponse?.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Prueba exitosa',
          detail: 'La configuración SMTP es válida y puede enviar emails',
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Prueba fallida',
          detail: testResponse?.error || 'Error al enviar email de prueba',
        });
      }
    } catch (error: any) {
      console.error('Test configuration error:', error);
      this.testResult.set({
        success: false,
        error: error?.message || 'Error al probar la configuración',
        timestamp: new Date().toISOString(),
      });

      this.messageService.add({
        severity: 'error',
        summary: 'Error de prueba',
        detail: 'No se pudo probar la configuración SMTP',
      });
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.settingsForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving.set(true);
    const formValues = this.settingsForm.value;
    const currentSettings = this.currentSettings();

    try {
      let savedSettings: EmailSettingsResponseDto;

      if (currentSettings?.id) {
        // Update existing settings
        const updateData: UpdateEmailSettingsDto = { ...formValues };
        await this.emailService
          .updateEmailSettings(String(currentSettings.id), updateData)
          .toPromise();
        // Reload settings from the service after update
        const reloadedSettings = await this.emailService.getEmailSettings().toPromise();
        savedSettings = reloadedSettings!;
      } else {
        // Create new settings
        const createData: EmailSettingsDto = formValues;
        const createdSettings = await this.emailService.createEmailSettings(createData).toPromise();
        savedSettings = createdSettings!;
      }

      if (savedSettings) {
        this.currentSettings.set(savedSettings);
      }
      this.emailService.refreshSettings(); // Refresh the service state

      this.messageService.add({
        severity: 'success',
        summary: 'Configuración guardada',
        detail: 'La configuración de email se ha guardado exitosamente',
      });
    } catch (error: any) {
      console.error('Save settings error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error al guardar',
        detail: error?.message || 'No se pudo guardar la configuración',
      });
    } finally {
      this.saving.set(false);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.settingsForm.controls).forEach((key) => {
      const control = this.settingsForm.get(key);
      control?.markAsTouched();
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
