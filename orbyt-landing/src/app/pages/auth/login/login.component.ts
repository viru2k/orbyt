import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-page">
      <div class="login-container">
        <div class="login-header">
          <div class="logo">
            <div class="brand-logo"></div>
            <span class="brand-text">Orbyt</span>
          </div>
          <h1>Iniciar sesión</h1>
          <p>Accede a tu cuenta de Orbyt</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              [class.error]="isFieldInvalid('email')"
              placeholder="tu@email.com">
            <div class="error-message" *ngIf="isFieldInvalid('email')">
              <span *ngIf="loginForm.get('email')?.errors?.['required']">El email es requerido</span>
              <span *ngIf="loginForm.get('email')?.errors?.['email']">Email no válido</span>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="password-input">
              <input 
                [type]="showPassword() ? 'text' : 'password'"
                id="password" 
                formControlName="password"
                [class.error]="isFieldInvalid('password')"
                placeholder="Tu contraseña">
              <button type="button" 
                      class="password-toggle" 
                      (click)="togglePassword()">
                <i [class]="showPassword() ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
              </button>
            </div>
            <div class="error-message" *ngIf="isFieldInvalid('password')">
              La contraseña es requerida
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="rememberMe">
              <span class="checkmark"></span>
              Recordarme
            </label>
            <a href="#" class="forgot-password">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" 
                  class="login-btn" 
                  [disabled]="loginForm.invalid || isLoading()">
            <i class="pi pi-spin pi-spinner" *ngIf="isLoading()"></i>
            {{ isLoading() ? 'Iniciando sesión...' : 'Iniciar sesión' }}
          </button>

          <div class="divider">
            <span>o</span>
          </div>

          <div class="social-login">
            <button type="button" class="social-btn google-btn" (click)="loginWithGoogle()">
              <i class="pi pi-google"></i>
              Continuar con Google
            </button>
            <button type="button" class="social-btn apple-btn" (click)="loginWithApple()">
              <i class="pi pi-apple"></i>
              Continuar con Apple
            </button>
          </div>

          <div class="register-link">
            ¿No tienes una cuenta? <a [routerLink]="['/auth/register']">Regístrate gratis</a>
          </div>
        </form>

        <div class="demo-info">
          <div class="demo-badge">
            <i class="pi pi-info-circle"></i>
            <span>Demo disponible</span>
          </div>
          <p>Prueba Orbyt sin registrarte usando nuestro <a href="#" (click)="startDemo()">tour interactivo</a></p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      
      try {
        await this.mockLogin();
        
        // In a real app, this would redirect to the main dashboard
        alert('Login exitoso! En una aplicación real, esto te redirigiría al dashboard principal.');
        
      } catch (error) {
        console.error('Login error:', error);
        alert('Error de login: Credenciales inválidas');
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  private async mockLogin(): Promise<void> {
    // Simulate API delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const { email, password } = this.loginForm.value;
        

      }, 1500);
    });
  }

  loginWithGoogle(): void {
    console.log('Google login initiated');
    alert('Login con Google (funcionalidad simulada)');
  }

  loginWithApple(): void {
    console.log('Apple login initiated');
    alert('Login con Apple (funcionalidad simulada)');
  }

  startDemo(): void {
    console.log('Starting demo');
    alert('Iniciando tour interactivo (funcionalidad simulada)');
  }
}