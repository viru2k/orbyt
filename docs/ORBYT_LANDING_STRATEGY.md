# 🚀 Orbyt Landing - Estrategia Completa de Marketing y Conversión

## 🎯 Posicionamiento y Propuesta de Valor

### **Tagline Principal**
*"La plataforma todo-en-uno que revoluciona la gestión de tu negocio de servicios"*

### **Value Proposition**
- **Problema**: Los profesionales y pequeñas empresas pierden tiempo gestionando clientes, citas, facturas y servicios en múltiples herramientas desconectadas.
- **Solución**: Orbyt unifica gestión de clientes, agenda inteligente, facturación automática y control de servicios en una plataforma moderna y fácil de usar.
- **Diferenciador**: Diseñado específicamente para profesionales hispanohablantes con cumplimiento fiscal automático y UX intuitiva.

### **Target Audience**
1. **Consultores y freelancers** (medicina, derecho, consultoría)
2. **Pequeñas clínicas y centros** (hasta 10 profesionales)
3. **Empresas de servicios** (belleza, wellness, reparaciones)
4. **Profesionales digitales** (coaches, terapeutas online)

---

## 🗺️ Arquitectura de Landing - Páginas y Rutas

### **Estructura de Rutas**
```
/landing/
├── / (Homepage)
├── /precios (Pricing)
├── /funcionalidades (Features)
├── /demo (Interactive Demo)
├── /sobre-nosotros (About)
├── /contacto (Contact)
├── /recursos/
│   ├── /blog
│   ├── /casos-exito
│   ├── /webinars
│   └── /guias
├── /legal/
│   ├── /privacidad
│   ├── /terminos
│   └── /cookies
├── /auth/
│   ├── /registro
│   ├── /login
│   └── /verificar-email
└── /checkout/
    ├── /plan/:slug
    ├── /pago
    ├── /confirmacion
    └── /dashboard-bienvenida
```

---

## 💰 Planes de Precios (Datos Mock Realistas)

### **Plan Starter - 29€/mes**
```json
{
  "name": "Starter",
  "price": 29,
  "yearlyPrice": 290,
  "savings": "17% descuento anual",
  "description": "Perfecto para freelancers y consultores individuales",
  "target": "1 usuario",
  "popular": false,
  "features": [
    "✅ Hasta 100 clientes",
    "✅ Agenda básica con recordatorios SMS",
    "✅ Facturación automática (hasta 50/mes)",
    "✅ Gestión de servicios básica",
    "✅ Reportes mensuales",
    "✅ Soporte por email",
    "✅ App móvil",
    "✅ Backup automático"
  ],
  "limits": {
    "clients": 100,
    "invoices": 50,
    "users": 1,
    "storage": "1GB",
    "smsReminders": 100
  }
}
```

### **Plan Professional - 59€/mes** ⭐ *Más Popular*
```json
{
  "name": "Professional",
  "price": 59,
  "yearlyPrice": 590,
  "savings": "17% descuento anual",
  "description": "Ideal para pequeñas clínicas y empresas en crecimiento",
  "target": "Hasta 5 usuarios",
  "popular": true,
  "features": [
    "✅ **Todo lo de Starter, más:**",
    "✅ Hasta 500 clientes",
    "✅ Agenda avanzada con salas y recursos",
    "✅ Facturación ilimitada + recordatorios automáticos",
    "✅ Gestión completa de servicios e inventario",
    "✅ Analytics avanzados y reportes personalizados",
    "✅ Integración con calendarios externos",
    "✅ API para integraciones",
    "✅ Soporte prioritario (chat + teléfono)",
    "✅ Plantillas personalizables",
    "✅ Marketing por email básico"
  ],
  "limits": {
    "clients": 500,
    "invoices": "unlimited",
    "users": 5,
    "storage": "10GB",
    "smsReminders": 500,
    "emailCampaigns": 10
  }
}
```

### **Plan Enterprise - 99€/mes**
```json
{
  "name": "Enterprise",
  "price": 99,
  "yearlyPrice": 990,
  "savings": "17% descuento anual",
  "description": "Para empresas establecidas que requieren personalización",
  "target": "Usuarios ilimitados",
  "popular": false,
  "features": [
    "✅ **Todo lo de Professional, más:**",
    "✅ Clientes ilimitados",
    "✅ Usuarios y ubicaciones ilimitadas",
    "✅ Workflow automation avanzado",
    "✅ Multi-tenant y marca blanca",
    "✅ Integración ERP/CRM personalizada",
    "✅ Reportes ejecutivos en tiempo real",
    "✅ Manager dedicado de cuenta",
    "✅ SLA de 99.9% uptime",
    "✅ Onboarding personalizado",
    "✅ Training del equipo incluido"
  ],
  "limits": {
    "clients": "unlimited",
    "invoices": "unlimited",
    "users": "unlimited",
    "storage": "100GB",
    "smsReminders": "unlimited",
    "emailCampaigns": "unlimited",
    "customIntegrations": 5
  }
}
```

---

## 🛒 Flujo Completo de Suscripción (Paso a Paso)

### **Paso 1: Landing Page**
```
Homepage (/) → [Botón CTA "Prueba Gratis 14 días"]
↓
Pricing Page (/precios) → [Seleccionar Plan]
```

### **Paso 2: Registro**
```
/auth/registro → Formulario:
{
  "email": "Required",
  "password": "Required (8+ chars)",
  "firstName": "Required",
  "lastName": "Required", 
  "companyName": "Optional",
  "teamSize": "Select: 1, 2-10, 11-50, 51+",
  "industry": "Select: Salud, Consultoría, Belleza, Otros",
  "selectedPlan": "Hidden field from previous page"
}

→ [Registro exitoso] → Email verificación
```

### **Paso 3: Verificación Email**
```
Email inbox → Click verification link
↓
/auth/verificar-email?token=xxx → [Cuenta verificada]
↓
Redirect a /checkout/plan/professional
```

### **Paso 4: Checkout Process**
```
/checkout/plan/:slug → Plan Summary + Payment:

Plan Selected: Professional - 59€/mes
✅ 14 días gratis, luego 59€/mes
✅ Cancela en cualquier momento
✅ Sin compromiso a largo plazo

[Selector: Mensual/Anual] → Precio actualizado dinámicamente
[Formulario de pago con Stripe Elements]
```

### **Paso 5: Información de Facturación**
```
Billing Information:
- Nombre completo
- Empresa (opcional)
- Dirección completa
- NIF/CIF (para España)
- País (afecta cálculo IVA)

Payment Method:
- Tarjeta de crédito/débito
- SEPA Direct Debit (Europa)
- PayPal (opcional)
```

### **Paso 6: Confirmación y Procesamiento**
```
/checkout/pago → Processing screen
↓
Stripe webhook confirms payment
↓
Account activated + trial period started
↓
Redirect: /checkout/confirmacion
```

### **Paso 7: Onboarding**
```
/checkout/dashboard-bienvenida → Welcome flow:

1. "¡Bienvenido a Orbyt!"
2. Setup checklist:
   ✅ Crear tu primer cliente
   ✅ Configurar tu primer servicio  
   ✅ Agendar tu primera cita
   ✅ Generar tu primera factura

3. Tutorial interactivo (opcional)
4. [Ir al Dashboard] → Redirect to main app
```

---

## 💳 Portal de Pago Detallado (Stripe Integration)

### **Página de Checkout (/checkout/plan/:slug)**

#### **Sección 1: Plan Summary**
```html
<div class="plan-summary">
  <h2>Plan Professional</h2>
  <div class="price-display">
    <span class="price">59€</span>
    <span class="period">/mes</span>
    <div class="trial-badge">14 días gratis</div>
  </div>
  
  <div class="billing-toggle">
    <label>
      <input type="radio" name="billing" value="monthly" checked>
      Mensual - 59€/mes
    </label>
    <label>
      <input type="radio" name="billing" value="yearly">
      Anual - 590€/año <span class="savings">(Ahorras 118€)</span>
    </label>
  </div>
</div>
```

#### **Sección 2: Payment Form**
```html
<form id="payment-form">
  <!-- Billing Address -->
  <div class="billing-section">
    <h3>Información de Facturación</h3>
    <input type="text" name="fullName" placeholder="Nombre completo" required>
    <input type="text" name="company" placeholder="Empresa (opcional)">
    <input type="text" name="address" placeholder="Dirección" required>
    <input type="text" name="city" placeholder="Ciudad" required>
    <input type="text" name="postalCode" placeholder="Código postal" required>
    <select name="country" required>
      <option value="ES">España</option>
      <option value="MX">México</option>
      <!-- etc -->
    </select>
    <input type="text" name="taxId" placeholder="NIF/CIF (opcional)">
  </div>

  <!-- Stripe Card Element -->
  <div class="payment-section">
    <h3>Método de Pago</h3>
    <div id="stripe-card-element">
      <!-- Stripe Elements card will be inserted here -->
    </div>
    <div id="card-errors" role="alert"></div>
  </div>

  <!-- Terms & Conditions -->
  <div class="terms-section">
    <label>
      <input type="checkbox" required>
      Acepto los <a href="/legal/terminos">términos de servicio</a> y 
      <a href="/legal/privacidad">política de privacidad</a>
    </label>
  </div>

  <button type="submit" id="submit-payment">
    <span id="button-text">
      Iniciar Prueba Gratuita - 14 días
    </span>
    <span id="spinner" class="hidden">Procesando...</span>
  </button>
</form>
```

#### **Lógica de JavaScript (Stripe Integration)**
```javascript
// Initialize Stripe
const stripe = Stripe('pk_publishable_key');
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#stripe-card-element');

// Handle form submission
document.getElementById('payment-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  
  // Create payment method
  const {paymentMethod, error} = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
    billing_details: {
      name: document.querySelector('[name="fullName"]').value,
      address: {
        line1: document.querySelector('[name="address"]').value,
        city: document.querySelector('[name="city"]').value,
        postal_code: document.querySelector('[name="postalCode"]').value,
        country: document.querySelector('[name="country"]').value,
      },
    },
  });

  if (error) {
    showError(error.message);
    return;
  }

  // Create subscription on backend
  const response = await fetch('/api/subscriptions/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      planSlug: planSlug,
      billingPeriod: billingPeriod,
      paymentMethodId: paymentMethod.id,
      billingDetails: getBillingDetails(),
    }),
  });

  const subscription = await response.json();
  
  if (subscription.status === 'requires_action') {
    // 3D Secure authentication required
    const {error: confirmationError} = await stripe.confirmCardPayment(
      subscription.client_secret
    );
    
    if (confirmationError) {
      showError(confirmationError.message);
    } else {
      window.location.href = '/checkout/confirmacion';
    }
  } else if (subscription.status === 'active' || subscription.status === 'trialing') {
    // Success!
    window.location.href = '/checkout/confirmacion';
  } else {
    showError('Error procesando el pago');
  }
});
```

---

## 🖼️ Arquitectura Frontend - Componentes Necesarios

### **Estructura de Carpetas**
```
src/
├── app/
│   └── landing/
│       ├── components/
│       │   ├── common/
│       │   │   ├── header.component.ts
│       │   │   ├── footer.component.ts
│       │   │   ├── cta-button.component.ts
│       │   │   └── pricing-card.component.ts
│       │   ├── sections/
│       │   │   ├── hero.component.ts
│       │   │   ├── features.component.ts
│       │   │   ├── testimonials.component.ts
│       │   │   ├── pricing.component.ts
│       │   │   └── faq.component.ts
│       │   └── forms/
│       │       ├── lead-capture.component.ts
│       │       ├── contact.component.ts
│       │       └── newsletter.component.ts
│       ├── pages/
│       │   ├── home/
│       │   ├── pricing/
│       │   ├── features/
│       │   ├── about/
│       │   ├── contact/
│       │   └── demo/
│       ├── auth/
│       │   ├── login.component.ts
│       │   ├── register.component.ts
│       │   └── verify-email.component.ts
│       ├── checkout/
│       │   ├── plan-selection.component.ts
│       │   ├── payment-form.component.ts
│       │   ├── confirmation.component.ts
│       │   └── welcome-onboarding.component.ts
│       ├── services/
│       │   ├── landing.service.ts
│       │   ├── auth.service.ts
│       │   ├── subscription.service.ts
│       │   └── payment.service.ts
│       └── models/
│           ├── plan.interface.ts
│           ├── user.interface.ts
│           └── subscription.interface.ts
```

### **Componentes Principales**

#### **1. PricingCardComponent**
```typescript
@Component({
  selector: 'app-pricing-card',
  template: `
    <div class="pricing-card" [class.popular]="plan.popular">
      <div class="plan-header">
        <h3>{{ plan.name }}</h3>
        <div class="price-display">
          <span class="currency">€</span>
          <span class="amount">{{ currentPrice }}</span>
          <span class="period">/{{ billingPeriod }}</span>
        </div>
        <p class="description">{{ plan.description }}</p>
      </div>
      
      <div class="features-list">
        <div *ngFor="let feature of plan.features" class="feature">
          {{ feature }}
        </div>
      </div>
      
      <button class="cta-button" [class.popular]="plan.popular" 
              (click)="selectPlan()">
        Prueba Gratis 14 Días
      </button>
    </div>
  `
})
export class PricingCardComponent {
  @Input() plan: PricingPlan;
  @Input() billingPeriod: 'monthly' | 'yearly' = 'monthly';
  
  get currentPrice() {
    return this.billingPeriod === 'yearly' ? this.plan.yearlyPrice : this.plan.price;
  }
}
```

#### **2. CheckoutPaymentComponent**
```typescript
@Component({
  selector: 'app-checkout-payment',
  template: `
    <div class="checkout-container">
      <div class="plan-summary">
        <h2>{{ selectedPlan.name }}</h2>
        <!-- Plan details -->
      </div>
      
      <form [formGroup]="paymentForm" (ngSubmit)="processPayment()">
        <!-- Billing form -->
        <div class="stripe-card" #stripeCard></div>
        <button type="submit" [disabled]="processing">
          {{ processing ? 'Procesando...' : 'Iniciar Prueba Gratuita' }}
        </button>
      </form>
    </div>
  `
})
export class CheckoutPaymentComponent implements OnInit {
  @ViewChild('stripeCard', {static: true}) stripeCardElement: ElementRef;
  
  stripe: Stripe;
  cardElement: StripeCardElement;
  paymentForm: FormGroup;
  processing = false;
  
  async processPayment() {
    this.processing = true;
    
    // Create payment method and subscription
    const paymentMethod = await this.createPaymentMethod();
    const subscription = await this.subscriptionService.create({
      planId: this.selectedPlan.id,
      paymentMethodId: paymentMethod.id,
      billingDetails: this.paymentForm.value
    });
    
    this.handleSubscriptionResult(subscription);
  }
}
```

---

## 📊 Páginas Principales - Contenido y Estructura

### **Homepage (/) - Estructura**

#### **Sección Hero**
```html
<section class="hero">
  <h1>Gestiona tu negocio de servicios como un profesional</h1>
  <p class="subtitle">
    Orbyt unifica agenda, clientes, facturación y servicios en una plataforma 
    moderna diseñada para profesionales hispanohablantes.
  </p>
  <div class="cta-buttons">
    <button class="primary">Prueba Gratis 14 Días</button>
    <button class="secondary">Ver Demo</button>
  </div>
  <div class="hero-image">
    <!-- Screenshot del dashboard -->
  </div>
</section>
```

#### **Sección Social Proof**
```html
<section class="social-proof">
  <p>Usado por más de 1,500 profesionales en toda España y Latinoamérica</p>
  <div class="logos">
    <!-- Logos de clientes ficticio -->
  </div>
  <div class="testimonial-preview">
    "Orbyt me ahorró 10 horas semanales en gestión administrativa" 
    - Dr. María González, Clínica Wellness
  </div>
</section>
```

#### **Sección Features**
```html
<section class="features">
  <h2>Todo lo que necesitas en un solo lugar</h2>
  <div class="features-grid">
    <div class="feature">
      <icon>📅</icon>
      <h3>Agenda Inteligente</h3>
      <p>Programa citas con recordatorios automáticos por SMS y email</p>
    </div>
    <div class="feature">
      <icon>👥</icon>
      <h3>Gestión de Clientes</h3>
      <p>Base de datos completa con historial y notas personalizadas</p>
    </div>
    <div class="feature">
      <icon>📊</icon>
      <h3>Facturación Automática</h3>
      <p>Genera facturas profesionales cumpliendo normativa fiscal</p>
    </div>
    <div class="feature">
      <icon>⚡</icon>
      <h3>Servicios y Precios</h3>
      <p>Catálogo completo con tarifas flexibles y promociones</p>
    </div>
  </div>
</section>
```

### **Página de Precios (/precios)**
- Comparativa clara de los 3 planes
- Toggle mensual/anual con % descuento
- FAQ específica de pricing
- Calculadora de ROI
- Testimonios de valor

---

## 🎨 Diseño y UX - Consideraciones Clave

### **Principios de Diseño**
1. **Mobile-first**: 70% del tráfico será móvil
2. **Carga rápida**: <2s tiempo de carga
3. **Conversión optimizada**: CTAs claros y prominentes
4. **Trust signals**: Testimonios, logos, garantías
5. **Localización**: Euros, español, referencias culturales

### **Paleta de Colores (Mock)**
```scss
:root {
  --primary: #2563eb;     // Azul profesional
  --secondary: #10b981;   // Verde éxito
  --accent: #f59e0b;      // Naranja llamativo
  --dark: #1f2937;        // Gris oscuro
  --light: #f9fafb;       // Gris claro
  --danger: #ef4444;      // Rojo errores
}
```

---

## 📈 Métricas y Optimización

### **KPIs Principales**
- **Conversion Rate**: Target 3-5% (visitante → trial)
- **Trial to Paid**: Target 15-25%
- **Page Load Speed**: <2 segundos
- **Mobile Conversion**: Optimizar para >50%
- **CAC (Cost per Acquisition)**: <50€ por customer

### **A/B Tests Planificados**
1. Headlines del hero section
2. Precios (freemium vs trial)
3. Longitud de formulario de registro
4. Posición y color de CTAs
5. Testimoniales vs features

---

## 🚧 Roadmap de Implementación

### **Sprint 1 (1 semana): Fundación**
- Setup routing y arquitectura básica
- Componentes comunes (header, footer, CTAs)
- Homepage básica con hero y features
- Responsive layout foundation

### **Sprint 2 (1 semana): Contenido Core**
- Página de precios completa
- Sistema de routing
- Formularios de lead capture
- Sección de testimoniales

### **Sprint 3 (1 semana): Auth & Registration**
- Componentes de auth (login/register)
- Integración con backend APIs
- Validaciones de formulario
- Email verification flow

### **Sprint 4 (1 semana): Checkout & Payments**
- Stripe integration completa
- Checkout flow end-to-end
- Payment processing
- Success/error handling

### **Sprint 5 (1 semana): Optimización**
- SEO optimization
- Performance tuning
- Mobile UX polish
- Analytics implementation

---

## 💡 Funcionalidades Avanzadas (Futuras)

### **Personalización Dinámica**
- Contenido adaptado por industria del usuario
- Precios localizados por país
- Testimoniales relevantes por sector

### **Marketing Automation**
- Drip campaigns para usuarios trial
- Remarketing para abandonos de carrito
- Referral program con incentivos

### **Recursos y Contenido**
- Blog con SEO-focused articles
- Webinars y demos en vivo
- Casos de éxito detallados
- Templates y recursos descargables

---

**Resultado esperado**: Una landing page moderna, optimizada para conversión y completamente integrada con un sistema de suscripciones robusto que genere un flujo predecible de clientes para Orbyt.