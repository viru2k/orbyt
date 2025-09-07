# ORBYT Landing - Guía de Integración Frontend

## 🎯 Resumen Ejecutivo

El **ORBYT Landing Service** es un microservicio independiente (puerto 3001) especializado en:
- Procesamiento de pagos españoles (Redsys + Stripe)
- Gestión de suscripciones y trials
- Registro y autenticación de usuarios
- Dashboard básico de suscriptores

**⚠️ IMPORTANTE**: Este es un servicio separado del backoffice-hub principal.

---

## 🏗️ Arquitectura Frontend-Backend

```
Frontend Landing Page (Puerto 4200)
        ↓ HTTP Requests
ORBYT Landing Service (Puerto 3001) ← NUEVO MICROSERVICIO
        ↓ Database
PostgreSQL (orbyt_landing_db) ← NUEVA BD INDEPENDIENTE

Backoffice Hub (Puerto 3000) ← SERVICIO EXISTENTE
        ↓ Database  
PostgreSQL (orbyt_db) ← BD PRINCIPAL EXISTENTE
```

---

## 🔌 APIs Disponibles para Frontend

### Base URL
```typescript
const API_BASE_URL = 'http://localhost:3001/api';
// Producción: 'https://landing-api.orbyt.com/api'
```

### 1. **APIs Públicas** (No requieren autenticación)

#### **GET /landing/plans** - Obtener Planes de Suscripción
```typescript
interface SubscriptionPlan {
  id: number;
  name: string; // "Starter", "Professional", "Enterprise"
  slug: string; // "starter", "professional", "enterprise"
  description: string;
  priceEur: number; // Precio mensual en EUR
  yearlyPriceEur?: number; // Precio anual con descuento
  billingPeriod: 'monthly' | 'yearly';
  features: string[]; // ["Hasta 100 clientes", "Facturación básica"]
  limits: {
    clients: number;
    invoices: number;
    storage: string;
  };
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}

// Uso en frontend
const getPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await fetch(`${API_BASE_URL}/landing/plans`);
  return response.json();
};
```

#### **POST /landing/leads** - Captura de Leads
```typescript
interface CreateLeadDto {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  message?: string;
  leadType: 'contact' | 'demo' | 'newsletter' | 'trial';
  utmData?: {
    utm_source?: string;
    utm_campaign?: string;
    utm_medium?: string;
  };
}

interface LeadResponse {
  success: boolean;
  message: string;
  leadId: number;
}

// Uso en frontend
const captureLead = async (leadData: CreateLeadDto): Promise<LeadResponse> => {
  const response = await fetch(`${API_BASE_URL}/landing/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData)
  });
  return response.json();
};
```

### 2. **Autenticación**

#### **POST /auth/register** - Registro con Plan Seleccionado
```typescript
interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  phone?: string;
  country?: string; // Default: 'ES'
  industry?: string;
  teamSize?: '1' | '2-10' | '11-50' | '51-200' | '200+';
  planSlug: string; // 'starter', 'professional', 'enterprise'
}

interface AuthResponse {
  success: boolean;
  message: string;
  token: string; // JWT Token
  user: {
    id: number;
    email: string;
    firstName: string;
    status: 'lead' | 'trial' | 'active' | 'cancelled' | 'expired';
  };
}
```

#### **POST /auth/login** - Login de Usuarios
```typescript
interface LoginDto {
  email: string;
  password: string;
}

// Mismo AuthResponse que register
```

### 3. **Gestión de Suscripciones** (Requieren JWT)

#### **GET /subscriptions/current** - Suscripción Actual
```typescript
interface UserSubscription {
  id: number;
  planName: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  trialEnd?: string; // ISO date
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  amount: number; // EUR
}
```

#### **POST /subscriptions/create** - Crear Suscripción
```typescript
interface CreateSubscriptionDto {
  planId: number;
  billingPeriod: 'monthly' | 'yearly';
  paymentProvider: 'redsys' | 'stripe'; // Frontend puede elegir
}

interface CreateSubscriptionResponse {
  success: boolean;
  subscription: UserSubscription;
  paymentSetup: {
    provider: 'redsys' | 'stripe';
    clientSecret?: string; // Para Stripe
    redsysUrl?: string; // Para Redsys redirect
    redsysParams?: Record<string, string>; // Parámetros Redsys
  };
}
```

### 4. **Dashboard de Usuario** (Requieren JWT)

#### **GET /dashboard/stats** - Estadísticas del Usuario
```typescript
interface DashboardStats {
  subscription: {
    plan: string;
    status: string;
    nextBilling: string;
    amount: number;
  };
  usage: {
    clients: { current: number; limit: number };
    invoices: { current: number; limit: number };
    storage: { current: string; limit: string };
  };
  paymentMethods: Array<{
    id: number;
    type: 'card';
    lastFour: string;
    brand: string; // 'visa', 'mastercard'
    isDefault: boolean;
  }>;
}
```

---

## 💳 Integración de Pagos

### Flujo Recomendado para España

#### 1. **Selección Automática de Gateway**
```typescript
const getPaymentProvider = (userCountry: string): 'redsys' | 'stripe' => {
  return userCountry === 'ES' ? 'redsys' : 'stripe';
};
```

#### 2. **Procesamiento con Redsys** (Usuarios españoles)
```typescript
// El backend devuelve una URL de redirection
const processRedsysPayment = (redsysUrl: string, params: Record<string, string>) => {
  // Crear formulario oculto y enviarlo
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = redsysUrl;
  
  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  
  document.body.appendChild(form);
  form.submit();
};
```

#### 3. **Procesamiento con Stripe** (Usuarios internacionales)
```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');

const processStripePayment = async (clientSecret: string) => {
  const { error } = await stripe!.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: { name: 'Usuario' }
    }
  });
  
  if (error) {
    console.error('Error en pago:', error);
  } else {
    console.log('Pago exitoso');
  }
};
```

---

## 🔒 Autenticación Frontend

### Setup del Token JWT
```typescript
// Guardar token después del login/register
localStorage.setItem('orbyt_landing_token', authResponse.token);

// Interceptor para requests autenticados
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('orbyt_landing_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Manejo de Estados de Usuario
```typescript
type UserStatus = 'lead' | 'trial' | 'active' | 'cancelled' | 'expired';

const getStatusColor = (status: UserStatus): string => {
  switch (status) {
    case 'lead': return 'gray';
    case 'trial': return 'yellow';
    case 'active': return 'green';
    case 'cancelled': return 'red';
    case 'expired': return 'red';
  }
};

const getStatusText = (status: UserStatus): string => {
  switch (status) {
    case 'lead': return 'Prospecto';
    case 'trial': return 'Periodo de Prueba';
    case 'active': return 'Suscripción Activa';
    case 'cancelled': return 'Cancelada';
    case 'expired': return 'Expirada';
  }
};
```

---

## 📱 Componentes Frontend Sugeridos

### 1. **Selector de Planes** (`PlanSelector.component`)
```typescript
@Component({
  template: `
    <div class="plans-grid">
      <div *ngFor="let plan of plans" 
           class="plan-card"
           [class.popular]="plan.isPopular"
           (click)="selectPlan(plan)">
        <h3>{{ plan.name }}</h3>
        <div class="price">
          {{ plan.priceEur }}€<span>/mes</span>
        </div>
        <div class="yearly-price" *ngIf="plan.yearlyPriceEur">
          {{ plan.yearlyPriceEur }}€/año (ahorra {{ getSavings(plan) }}€)
        </div>
        <ul class="features">
          <li *ngFor="let feature of plan.features">{{ feature }}</li>
        </ul>
        <button class="select-btn">Seleccionar Plan</button>
      </div>
    </div>
  `
})
export class PlanSelectorComponent {
  plans: SubscriptionPlan[] = [];
  
  async ngOnInit() {
    this.plans = await this.landingService.getPlans();
  }
  
  getSavings(plan: SubscriptionPlan): number {
    return (plan.priceEur * 12) - plan.yearlyPriceEur!;
  }
  
  selectPlan(plan: SubscriptionPlan) {
    this.router.navigate(['/register'], { 
      queryParams: { plan: plan.slug } 
    });
  }
}
```

### 2. **Formulario de Registro** (`RegisterForm.component`)
```typescript
@Component({
  template: `
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
      <!-- Información Personal -->
      <div class="form-section">
        <h3>Información Personal</h3>
        <input formControlName="email" placeholder="Email" type="email" required>
        <input formControlName="password" placeholder="Contraseña" type="password" required>
        <input formControlName="firstName" placeholder="Nombre" required>
        <input formControlName="lastName" placeholder="Apellidos" required>
      </div>
      
      <!-- Información de Empresa -->
      <div class="form-section">
        <h3>Información de Empresa</h3>
        <input formControlName="companyName" placeholder="Nombre de la empresa">
        <select formControlName="teamSize">
          <option value="1">Solo yo</option>
          <option value="2-10">2-10 empleados</option>
          <option value="11-50">11-50 empleados</option>
          <option value="51-200">51-200 empleados</option>
          <option value="200+">Más de 200</option>
        </select>
      </div>
      
      <!-- Plan Seleccionado -->
      <div class="selected-plan">
        <h4>Plan Seleccionado: {{ selectedPlan?.name }}</h4>
        <div class="price">{{ selectedPlan?.priceEur }}€/mes</div>
      </div>
      
      <button type="submit" [disabled]="!registerForm.valid">
        Crear Cuenta y Comenzar Trial
      </button>
    </form>
  `
})
export class RegisterFormComponent {
  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    companyName: [''],
    teamSize: ['1']
  });
  
  selectedPlan?: SubscriptionPlan;
  
  async onSubmit() {
    if (this.registerForm.valid) {
      const registerData: RegisterDto = {
        ...this.registerForm.value,
        planSlug: this.selectedPlan!.slug
      };
      
      try {
        const response = await this.authService.register(registerData);
        
        // Guardar token y redirigir
        localStorage.setItem('orbyt_landing_token', response.token);
        this.router.navigate(['/onboarding']);
        
      } catch (error) {
        this.handleError(error);
      }
    }
  }
}
```

### 3. **Dashboard de Usuario** (`UserDashboard.component`)
```typescript
@Component({
  template: `
    <div class="dashboard">
      <div class="subscription-card">
        <h3>Tu Suscripción</h3>
        <div class="status" [ngClass]="stats?.subscription.status">
          {{ getStatusText(stats?.subscription.status) }}
        </div>
        <div class="plan">{{ stats?.subscription.plan }}</div>
        <div class="next-billing">
          Próxima facturación: {{ stats?.subscription.nextBilling | date }}
        </div>
        <div class="amount">{{ stats?.subscription.amount }}€</div>
      </div>
      
      <div class="usage-cards">
        <div class="usage-card">
          <h4>Clientes</h4>
          <div class="progress">
            {{ stats?.usage.clients.current }} / {{ stats?.usage.clients.limit }}
          </div>
        </div>
        <div class="usage-card">
          <h4>Facturas</h4>
          <div class="progress">
            {{ stats?.usage.invoices.current }} / {{ stats?.usage.invoices.limit }}
          </div>
        </div>
      </div>
      
      <div class="payment-methods">
        <h3>Métodos de Pago</h3>
        <div *ngFor="let method of stats?.paymentMethods" class="payment-method">
          <span class="brand">{{ method.brand | titlecase }}</span>
          <span class="last-four">**** {{ method.lastFour }}</span>
          <span *ngIf="method.isDefault" class="default-badge">Principal</span>
        </div>
      </div>
    </div>
  `
})
export class UserDashboardComponent {
  stats?: DashboardStats;
  
  async ngOnInit() {
    this.stats = await this.dashboardService.getStats();
  }
}
```

---

## 🎨 Consideraciones de UX

### Flujo de Onboarding Recomendado

1. **Landing Page** → Mostrar planes con `PlanSelector`
2. **Selección Plan** → Redirigir a registro con plan pre-seleccionado
3. **Registro** → Formulario con información personal y empresarial
4. **Verificación Email** → Enviar email de confirmación
5. **Setup de Pago** → Configurar método de pago (Redsys/Stripe)
6. **Trial Iniciado** → Dashboard con período de prueba activo
7. **Conversión** → Al final del trial, procesar primer pago

### Mensajería Específica para España

```typescript
const spanishMessages = {
  paymentSecurity: 'Pagos seguros con Redsys - El sistema usado por el 90% de bancos españoles',
  vatIncluded: 'Precios incluyen IVA (21%)',
  trialMessage: '14 días gratis - Sin compromiso, cancela cuando quieras',
  supportPhone: '+34 900 123 456 - Soporte en español',
  gdprCompliance: 'Cumplimiento RGPD - Tus datos están seguros',
  spanishBanks: 'Compatible con todos los bancos españoles'
};
```

---

## 🚀 Variables de Entorno Frontend

```typescript
// environment.ts
export const environment = {
  production: false,
  landingApiUrl: 'http://localhost:3001/api',
  backofficeApiUrl: 'http://localhost:3000/api', // Servicio existente
  stripePublicKey: 'pk_test_...',
  // Redsys se maneja completamente en backend
};

// environment.prod.ts  
export const environment = {
  production: true,
  landingApiUrl: 'https://landing-api.orbyt.com/api',
  backofficeApiUrl: 'https://api.orbyt.com/api',
  stripePublicKey: 'pk_live_...',
};
```

---

## 📋 Checklist de Integración Frontend

### ✅ Setup Inicial
- [ ] Configurar variables de entorno
- [ ] Instalar dependencias (@stripe/stripe-js)
- [ ] Configurar interceptors HTTP con JWT
- [ ] Setup routing para nuevas páginas

### ✅ Componentes Principales
- [ ] PlanSelector component
- [ ] RegisterForm component  
- [ ] LoginForm component
- [ ] UserDashboard component
- [ ] PaymentSetup component

### ✅ Servicios Angular
- [ ] LandingService (planes, leads)
- [ ] AuthService (login, register)
- [ ] SubscriptionService (gestión suscripciones)
- [ ] DashboardService (stats usuario)

### ✅ Páginas/Rutas
- [ ] `/` - Landing page principal
- [ ] `/plans` - Selector de planes
- [ ] `/register` - Formulario registro
- [ ] `/login` - Formulario login
- [ ] `/dashboard` - Panel usuario
- [ ] `/onboarding` - Setup inicial

### ✅ Integraciones de Pago
- [ ] Setup Stripe Elements
- [ ] Manejo de redirects Redsys
- [ ] Estados de pago (loading, success, error)
- [ ] Validación de formularios de pago

### ✅ UX/UI España
- [ ] Textos en español
- [ ] Precios en EUR con IVA
- [ ] Logos de bancos españoles
- [ ] Cumplimiento RGPD
- [ ] Números de teléfono españoles

---

## 🔗 Enlaces Útiles

- **API Docs**: http://localhost:3001/api/docs (cuando el servicio esté ejecutándose)
- **Health Check**: http://localhost:3001/api/health
- **Redsys Docs**: https://canales.redsys.es/canales/ayuda
- **Stripe Docs**: https://stripe.com/docs/payments

---

**📅 Creado**: 30 de Agosto, 2025  
**🎯 Objetivo**: Guiar al equipo frontend en la integración con el nuevo microservicio de landing  
**✅ Estado**: Listo para implementación