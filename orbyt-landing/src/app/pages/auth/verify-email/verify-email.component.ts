import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="verify-email-page">
      <div class="verify-container">
        <div class="verify-content">
          <div class="email-icon">
            <i class="pi pi-envelope"></i>
          </div>

          <h1>Verifica tu email</h1>
          <p class="subtitle">
            Hemos enviado un enlace de verificación a tu dirección de email.
          </p>

          <div class="email-info">
            <div class="email-badge">
              <i class="pi pi-envelope"></i>
              <span>ejemplo&#64;email.com</span>
            </div>
          </div>

          <div class="instructions">
            <h3>Pasos para verificar:</h3>
            <ol>
              <li>Revisa tu bandeja de entrada</li>
              <li>Haz clic en el enlace de verificación</li>
              <li>Regresa aquí para continuar</li>
            </ol>
          </div>

          <div class="action-buttons">
            <button class="primary-button" (click)="checkVerification()">
              <i class="pi pi-refresh" [class.pi-spin]="isChecking()"></i>
              {{ isChecking() ? 'Verificando...' : 'Ya verifiqué mi email' }}
            </button>
            
            <button class="secondary-button" (click)="resendEmail()" [disabled]="cooldown() > 0">
              <i class="pi pi-send"></i>
              {{ cooldown() > 0 ? 'Reenviar en ' + cooldown() + 's' : 'Reenviar email' }}
            </button>
          </div>

          <div class="help-section">
            <h4>¿No encuentras el email?</h4>
            <ul class="help-list">
              <li>Revisa tu carpeta de spam o correo no deseado</li>
              <li>Asegúrate de que tu dirección de email sea correcta</li>
              <li>El email puede tardar unos minutos en llegar</li>
            </ul>
          </div>

          <div class="footer-links">
            <a [routerLink]="['/auth/login']">← Volver al login</a>
            <a href="#" (click)="contactSupport()">Contactar soporte</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent {
  isChecking = signal(false);
  cooldown = signal(0);

  checkVerification(): void {
    this.isChecking.set(true);
    
    // Simulate verification check
    setTimeout(() => {
      this.isChecking.set(false);
      alert('Email verificado exitosamente! (simulación)');
    }, 2000);
  }

  resendEmail(): void {
    if (this.cooldown() > 0) return;
    
    // Start cooldown
    this.cooldown.set(30);
    const interval = setInterval(() => {
      const current = this.cooldown();
      if (current <= 1) {
        clearInterval(interval);
        this.cooldown.set(0);
      } else {
        this.cooldown.set(current - 1);
      }
    }, 1000);

    console.log('Resending verification email...');
    alert('Email de verificación reenviado (simulación)');
  }

  contactSupport(): void {
    console.log('Contacting support...');
    alert('Contactando soporte (funcionalidad simulada)');
  }
}