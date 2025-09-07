import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrbitLandingApiService } from '../../services/orbyt-landing-api.service';
import { environment } from '../../../environments/environment';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
  popular?: boolean;
  cta: string;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="pricing-page">
      <div class="container">
        <div class="pricing-header">
          <h1>Planes y precios</h1>
          <p>Encuentra el plan perfecto para tu negocio</p>
          
          <div class="billing-toggle">
            <span [class.active]="!isYearly()">Mensual</span>
            <button class="toggle-switch" (click)="toggleBilling()">
              <div class="toggle-slider" [class.active]="isYearly()"></div>
            </button>
            <span [class.active]="isYearly()">
              Anual 
              <span class="discount-badge">-20%</span>
            </span>
          </div>
        </div>
        
        <!-- Loading state -->
        <div *ngIf="isLoading()" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Cargando planes...</p>
        </div>
        
        <!-- Error state -->
        <div *ngIf="error() && !isLoading()" class="error-state">
          <p class="error-message">{{ error() }}</p>
        </div>
        
        <!-- Plans grid -->
        <div *ngIf="!isLoading() && !error()" class="pricing-grid">
          <div 
            *ngFor="let plan of plans()" 
            class="pricing-card"
            [class.popular]="plan.popular"
            [class.highlighted]="plan.highlighted"
          >
            <div *ngIf="plan.popular" class="popular-badge">
              <i class="pi pi-star"></i>
              Más popular
            </div>
            
            <div class="plan-header">
              <h3 class="plan-name">{{ plan.name }}</h3>
              <p class="plan-description">{{ plan.description }}</p>
            </div>
            
            <div class="plan-price">
              <div class="price-display">
                <span class="currency">€</span>
                <span class="amount">{{ isYearly() ? plan.yearlyPrice : plan.monthlyPrice }}</span>
                <span class="period">/mes</span>
              </div>
              <div *ngIf="isYearly()" class="yearly-info">
                Facturado anualmente (€{{ plan.yearlyPrice * 12 }})
              </div>
              <div *ngIf="!isYearly()" class="monthly-info">
                Facturado mensualmente
              </div>
            </div>
            
            <a 
              [routerLink]="['/auth/register']" 
              [queryParams]="{ plan: plan.id, billing: isYearly() ? 'yearly' : 'monthly' }"
              class="plan-cta"
              [class.primary]="plan.popular || plan.highlighted"
            >
              <i class="pi pi-arrow-right"></i>
              {{ plan.cta }}
            </a>
            
            <div class="plan-features">
              <h4>Características incluidas:</h4>
              <ul>
                <li *ngFor="let feature of plan.features">
                  <i class="pi pi-check"></i>
                  {{ feature }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="pricing-faq">
          <h2>Preguntas frecuentes</h2>
          <div class="faq-grid">
            <div class="faq-item" *ngFor="let faq of faqs">
              <h4>{{ faq.question }}</h4>
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
        
        <div class="pricing-cta">
          <h2>¿Necesitas algo personalizado?</h2>
          <p>Contáctanos para planes empresariales a medida</p>
          <button class="contact-btn">
            <i class="pi pi-phone"></i>
            Contactar ventas
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./pricing.component.scss']
})
export class PricingComponent implements OnInit {
  private landingApi = inject(OrbitLandingApiService);

  isYearly = signal(false);
  plans = signal<PricingPlan[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // Fallback mock plans for development
  private mockPlans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfecto para emprendedores y freelancers',
      monthlyPrice: 9,
      yearlyPrice: 7,
      features: [
        'Hasta 100 clientes',
        'Facturación básica',
        'Agenda personal',
        'Soporte por email',
        '1 GB de almacenamiento',
        'Reportes básicos'
      ],
      cta: 'Comenzar gratis'
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Ideal para pequeñas empresas en crecimiento',
      monthlyPrice: 29,
      yearlyPrice: 23,
      features: [
        'Hasta 1,000 clientes',
        'Facturación avanzada',
        'Agenda compartida',
        'Soporte prioritario',
        '10 GB de almacenamiento',
        'Reportes avanzados',
        'Integraciones básicas',
        'Multi-usuario (5 usuarios)',
        'Recordatorios automáticos'
      ],
      popular: true,
      highlighted: true,
      cta: 'Prueba 14 días gratis'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Para empresas que necesitan máximo control',
      monthlyPrice: 79,
      yearlyPrice: 63,
      features: [
        'Clientes ilimitados',
        'Facturación personalizada',
        'Agenda multi-sede',
        'Soporte 24/7',
        'Almacenamiento ilimitado',
        'Reportes personalizados',
        'Todas las integraciones',
        'Usuarios ilimitados',
        'API completa',
        'Branding personalizado',
        'Manager dedicado'
      ],
      cta: 'Contactar ventas'
    }
  ];
  
  faqs = [
    {
      question: '¿Puedo cambiar de plan en cualquier momento?',
      answer: 'Sí, puedes actualizar o reducir tu plan en cualquier momento desde tu panel de control. Los cambios se reflejan inmediatamente.'
    },
    {
      question: '¿Qué incluye la prueba gratuita?',
      answer: 'La prueba gratuita de 14 días incluye todas las características del plan Professional, sin limitaciones.'
    },
    {
      question: '¿Cómo funciona la facturación?',
      answer: 'Facturamos mensual o anualmente según tu preferencia. Con facturación anual obtienes un 20% de descuento.'
    },
    {
      question: '¿Puedo cancelar en cualquier momento?',
      answer: 'Por supuesto. Puedes cancelar tu suscripción en cualquier momento sin penalizaciones. Tu cuenta permanecerá activa hasta el final del período pagado.'
    },
    {
      question: '¿Ofrecen soporte técnico?',
      answer: 'Todos los planes incluyen soporte técnico. Los planes Professional y Enterprise tienen soporte prioritario y 24/7 respectivamente.'
    },
    {
      question: '¿Mis datos están seguros?',
      answer: 'Absolutamente. Utilizamos encriptación de grado bancario y cumplimos con todas las regulaciones de protección de datos, incluyendo GDPR.'
    }
  ];
  
  async ngOnInit(): Promise<void> {
    await this.loadSubscriptionPlans();
  }

  toggleBilling(): void {
    this.isYearly.set(!this.isYearly());
  }

  private async loadSubscriptionPlans(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      
      if (environment.enableMockData) {
        // Use mock data in development
        setTimeout(() => {
          this.plans.set(this.mockPlans);
          this.isLoading.set(false);
        }, 500); // Simulate API delay
        return;
      }
      
      // Load real subscription plans from API
      const response = await this.landingApi.getSubscriptionPlans().toPromise();
      
      if (response && response.length > 0) {
        // Transform API response to component format
        const transformedPlans = response.map((apiPlan: any) => ({
          id: apiPlan.id,
          name: apiPlan.name,
          description: apiPlan.description,
          monthlyPrice: apiPlan.monthlyPrice,
          yearlyPrice: apiPlan.yearlyPrice || (apiPlan.monthlyPrice * 0.8), // 20% discount default
          features: apiPlan.features || [],
          highlighted: apiPlan.highlighted || false,
          popular: apiPlan.popular || false,
          cta: apiPlan.cta || 'Comenzar'
        }));
        
        this.plans.set(transformedPlans);
      } else {
        // Fallback to mock data if API returns empty
        this.plans.set(this.mockPlans);
      }
      
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      this.error.set('Error al cargar los planes. Mostrando planes por defecto.');
      
      // Fallback to mock data on error
      this.plans.set(this.mockPlans);
    } finally {
      this.isLoading.set(false);
    }
  }
}