import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { OrbitLandingApiService } from '../../../services/orbyt-landing-api.service';
import { environment } from '../../../../environments/environment';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  popular?: boolean;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="register-page">
      <div class="register-container">
        <div class="register-header">
          <div class="logo">
            <div class="brand-logo"></div>
            <span class="brand-text">Orbyt</span>
          </div>
          <h1>Crear cuenta</h1>
          <p>Únete a miles de profesionales que ya están creciendo con Orbyt</p>
        </div>

        <!-- Plan Selection -->
        <div class="plan-selection" *ngIf="!selectedPlan()">
          <h2>Selecciona tu plan</h2>
          <div class="billing-toggle">
            <label class="toggle-label" [class.active]="!isYearly()">Mensual</label>
            <button class="billing-switch" 
                    [class.yearly]="isYearly()" 
                    (click)="toggleBilling()">
              <span class="switch-handle"></span>
            </button>
            <label class="toggle-label" [class.active]="isYearly()">Anual (25% desc.)</label>
          </div>
          
          <!-- Loading state for plans -->
          <div *ngIf="plansLoading()" class="plans-loading">
            <div class="loading-spinner"></div>
            <p>Cargando planes...</p>
          </div>
          
          <!-- Error state for plans -->
          <div *ngIf="error() && !plansLoading()" class="plans-error">
            <p>{{ error() }}</p>
          </div>
          
          <div class="plans-grid" *ngIf="!plansLoading() && !error()">
            <div class="plan-card" 
                 *ngFor="let plan of plans()" 
                 [class.popular]="plan.popular"
                 (click)="selectPlan(plan)">
              <div class="plan-header">
                <h3>{{ plan.name }}</h3>
                <div class="plan-price">
                  <span class="currency">€</span>
                  <span class="amount">{{ isYearly() ? plan.yearlyPrice : plan.price }}</span>
                  <span class="period">/{{ isYearly() ? 'año' : 'mes' }}</span>
                </div>
                <p class="plan-description">{{ plan.description }}</p>
              </div>
              <ul class="plan-features">
                <li *ngFor="let feature of plan.features">
                  <i class="pi pi-check"></i>
                  {{ feature }}
                </li>
              </ul>
              <button class="select-plan-btn">
                Seleccionar {{ plan.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- Registration Form -->
        <div class="register-form-section" *ngIf="selectedPlan()">
          <div class="selected-plan-info">
            <div class="plan-summary">
              <h3>{{ selectedPlan()?.name }}</h3>
              <div class="plan-price">
                €{{ isYearly() ? selectedPlan()?.yearlyPrice : selectedPlan()?.price }}
                /{{ isYearly() ? 'año' : 'mes' }}
              </div>
            </div>
            <button class="change-plan-btn" (click)="changePlan()">Cambiar plan</button>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
            <h2>Información de cuenta</h2>
            
            <!-- Global error message -->
            <div *ngIf="error()" class="global-error">
              <i class="pi pi-exclamation-circle"></i>
              {{ error() }}
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">Nombre *</label>
                <input 
                  type="text" 
                  id="firstName" 
                  formControlName="firstName"
                  [class.error]="isFieldInvalid('firstName')"
                  placeholder="Tu nombre">
                <div class="error-message" *ngIf="isFieldInvalid('firstName')">
                  El nombre es requerido
                </div>
              </div>
              
              <div class="form-group">
                <label for="lastName">Apellidos *</label>
                <input 
                  type="text" 
                  id="lastName" 
                  formControlName="lastName"
                  [class.error]="isFieldInvalid('lastName')"
                  placeholder="Tus apellidos">
                <div class="error-message" *ngIf="isFieldInvalid('lastName')">
                  Los apellidos son requeridos
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input 
                type="email" 
                id="email" 
                formControlName="email"
                [class.error]="isFieldInvalid('email')"
                placeholder="tu@email.com">
              <div class="error-message" *ngIf="isFieldInvalid('email')">
                <span *ngIf="registerForm.get('email')?.errors?.['required']">El email es requerido</span>
                <span *ngIf="registerForm.get('email')?.errors?.['email']">Email no válido</span>
              </div>
            </div>

            <div class="form-group">
              <label for="password">Contraseña *</label>
              <input 
                type="password" 
                id="password" 
                formControlName="password"
                [class.error]="isFieldInvalid('password')"
                placeholder="Mínimo 8 caracteres">
              <div class="error-message" *ngIf="isFieldInvalid('password')">
                La contraseña debe tener al menos 8 caracteres
              </div>
            </div>

            <div class="form-group">
              <label for="company">Empresa</label>
              <input 
                type="text" 
                id="company" 
                formControlName="company"
                placeholder="Nombre de tu empresa (opcional)">
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="acceptTerms">
                <span class="checkmark"></span>
                Acepto los <a href="#" target="_blank">términos de servicio</a> y la <a href="#" target="_blank">política de privacidad</a> *
              </label>
              <div class="error-message" *ngIf="isFieldInvalid('acceptTerms')">
                Debes aceptar los términos de servicio
              </div>
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="acceptMarketing">
                <span class="checkmark"></span>
                Quiero recibir novedades y ofertas especiales por email
              </label>
            </div>

            <button type="submit" class="register-btn" [disabled]="registerForm.invalid || isLoading()">
              <i class="pi pi-spin pi-spinner" *ngIf="isLoading()"></i>
              {{ isLoading() ? 'Creando cuenta...' : 'Continuar al pago' }}
            </button>

            <div class="login-link">
              ¿Ya tienes una cuenta? <a [routerLink]="['/auth/login']">Inicia sesión</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  private landingApi = inject(OrbitLandingApiService);
  private route = inject(ActivatedRoute);
  
  registerForm!: FormGroup;
  selectedPlan = signal<PricingPlan | null>(null);
  isYearly = signal(false);
  isLoading = signal(false);
  plans = signal<PricingPlan[]>([]);
  plansLoading = signal(true);
  error = signal<string | null>(null);

  // Fallback mock plans for development
  private mockPlans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      yearlyPrice: 22,
      description: 'Perfecto para freelancers y autónomos',
      features: [
        'Hasta 100 clientes',
        'Facturación ilimitada',
        'Agenda básica',
        'Soporte por email',
        '5GB de almacenamiento'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 59,
      yearlyPrice: 44,
      description: 'Ideal para pequeñas empresas',
      popular: true,
      features: [
        'Hasta 500 clientes',
        'Facturación avanzada',
        'Agenda completa',
        'CRM integrado',
        'Soporte prioritario',
        '50GB de almacenamiento',
        'Informes avanzados'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      yearlyPrice: 74,
      description: 'Para empresas establecidas',
      features: [
        'Clientes ilimitados',
        'Todas las funciones',
        'API completa',
        'Soporte 24/7',
        'Manager dedicado',
        'Almacenamiento ilimitado',
        'Integraciones personalizadas'
      ]
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.initForm();
    await this.loadPlans();
    this.handleQueryParams();
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      company: [''],
      acceptTerms: [false, Validators.requiredTrue],
      acceptMarketing: [false]
    });
  }

  toggleBilling(): void {
    this.isYearly.set(!this.isYearly());
  }

  selectPlan(plan: PricingPlan): void {
    this.selectedPlan.set(plan);
  }

  changePlan(): void {
    this.selectedPlan.set(null);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.valid && this.selectedPlan()) {
      this.isLoading.set(true);
      this.error.set(null);
      
      try {
        if (environment.enableMockData) {
          // Use mock registration in development
          await this.mockRegisterUser();
        } else {
          // Use real API registration
          await this.registerWithApi();
        }
        
        // Navigate to checkout with user data and selected plan
        this.router.navigate(['/checkout'], {
          state: {
            userData: this.registerForm.value,
            selectedPlan: this.selectedPlan(),
            isYearly: this.isYearly()
          }
        });
      } catch (error: any) {
        console.error('Registration error:', error);
        this.error.set(error?.message || 'Error en el registro. Inténtalo de nuevo.');
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  private async mockRegisterUser(): Promise<void> {
    // Simulate API delay
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('User registered:', {
          userData: this.registerForm.value,
          selectedPlan: this.selectedPlan(),
          isYearly: this.isYearly()
        });
        resolve();
      }, 1500);
    });
  }

  private async loadPlans(): Promise<void> {
    try {
      this.plansLoading.set(true);
      this.error.set(null);
      
      if (environment.enableMockData) {
        // Use mock data in development
        setTimeout(() => {
          this.plans.set(this.mockPlans);
          this.plansLoading.set(false);
        }, 300);
        return;
      }
      
      // Load real subscription plans from API
      const response = await this.landingApi.getSubscriptionPlans().toPromise();
      
      if (response && response.length > 0) {
        // Transform API response to component format
        const transformedPlans = response.map((apiPlan: any) => ({
          id: apiPlan.id,
          name: apiPlan.name,
          price: apiPlan.monthlyPrice,
          yearlyPrice: apiPlan.yearlyPrice || (apiPlan.monthlyPrice * 0.8),
          description: apiPlan.description,
          features: apiPlan.features || [],
          popular: apiPlan.popular || false
        }));
        
        this.plans.set(transformedPlans);
      } else {
        this.plans.set(this.mockPlans);
      }
      
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      this.error.set('Error al cargar los planes');
      this.plans.set(this.mockPlans);
    } finally {
      this.plansLoading.set(false);
    }
  }
  
  private handleQueryParams(): void {
    // Handle plan selection from URL params (from pricing page)
    this.route.queryParams.subscribe(params => {
      if (params['plan'] && params['billing']) {
        const planId = params['plan'];
        const billing = params['billing'];
        
        // Find and select the plan
        const plan = this.plans().find(p => p.id === planId);
        if (plan) {
          this.selectedPlan.set(plan);
          this.isYearly.set(billing === 'yearly');
        }
      }
    });
  }
  
  private async registerWithApi(): Promise<void> {
    const formData = this.registerForm.value;
    const registerData = {
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      password: formData.password,
      company: formData.company || undefined,
      country: 'ES', // Default to Spain, could be detected from location
      planSlug: this.selectedPlan()?.id || 'starter'
    };
    
    const response = await this.landingApi.register(registerData).toPromise();
    
    if (response?.token) {
      // Store authentication token
      localStorage.setItem('orbyt_landing_token', response.token);
    }
  }
}