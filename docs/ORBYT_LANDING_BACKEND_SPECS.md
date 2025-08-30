# Orbyt Landing - Especificaciones Técnicas Backend

## 🎯 Objetivo General
Crear un sistema completo de backend para soportar una landing page comercial de Orbyt, incluyendo registro de usuarios, gestión de suscripciones, procesamiento de pagos y dashboard de administración.

---

## 🏗️ Arquitectura General

### Módulos Principales Requeridos

#### 1. **Auth & User Management**
- Sistema de autenticación JWT
- Registro y login de usuarios
- Verificación de email
- Recuperación de contraseña
- Gestión de perfiles de usuario

#### 2. **Subscription Management**
- CRUD de planes de suscripción
- Gestión de estado de suscripciones
- Upgrade/downgrade de planes
- Cancelación y reactivación
- Períodos de prueba gratuita

#### 3. **Payment Processing**
- Integración con Stripe/PayPal
- Procesamiento de pagos únicos y recurrentes
- Gestión de tarjetas de crédito
- Webhooks para eventos de pago
- Reembolsos y disputas

#### 4. **Billing & Invoicing**
- Generación automática de facturas
- Historial de pagos
- Gestión de impuestos (IVA)
- Reportes financieros
- Exportación de datos fiscales

#### 5. **CRM & Lead Management**
- Captura de leads desde landing
- Seguimiento de conversiones
- Email marketing automation
- Segmentación de usuarios
- Analytics de funnel de ventas

---

## 📊 Base de Datos - Nuevas Entidades

### **LandingUser**
```sql
CREATE TABLE landing_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(200),
  phone VARCHAR(20),
  country VARCHAR(50),
  industry VARCHAR(100),
  team_size ENUM('1', '2-10', '11-50', '51-200', '200+'),
  lead_source VARCHAR(100), -- google, facebook, referral, etc.
  utm_campaign VARCHAR(100),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  status ENUM('lead', 'trial', 'active', 'cancelled', 'expired') DEFAULT 'lead',
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **SubscriptionPlans**
```sql
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- 'Starter', 'Professional', 'Enterprise'
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL, -- precio mensual
  yearly_price DECIMAL(10,2), -- precio anual (con descuento)
  currency VARCHAR(3) DEFAULT 'EUR',
  billing_period ENUM('monthly', 'yearly') DEFAULT 'monthly',
  features JSON, -- lista de características incluidas
  limits JSON, -- límites del plan (clientes, facturas, etc.)
  stripe_price_id VARCHAR(100), -- ID del precio en Stripe
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **UserSubscriptions**
```sql
CREATE TABLE user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES landing_users(id),
  plan_id INTEGER REFERENCES subscription_plans(id),
  stripe_subscription_id VARCHAR(100),
  stripe_customer_id VARCHAR(100),
  status ENUM('trialing', 'active', 'past_due', 'canceled', 'unpaid') DEFAULT 'trialing',
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  canceled_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **PaymentMethods**
```sql
CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES landing_users(id),
  stripe_payment_method_id VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'card', -- card, sepa, etc.
  last_four VARCHAR(4),
  brand VARCHAR(20), -- visa, mastercard, etc.
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Invoices**
```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES landing_users(id),
  subscription_id INTEGER REFERENCES user_subscriptions(id),
  stripe_invoice_id VARCHAR(100),
  invoice_number VARCHAR(50) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  status ENUM('draft', 'open', 'paid', 'void', 'uncollectible') DEFAULT 'draft',
  due_date DATE,
  paid_at TIMESTAMP,
  invoice_pdf_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Leads**
```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(200),
  phone VARCHAR(20),
  message TEXT,
  lead_type ENUM('contact', 'demo', 'newsletter', 'trial') NOT NULL,
  source VARCHAR(100), -- landing page, blog, etc.
  utm_data JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  converted_to_user_id INTEGER REFERENCES landing_users(id),
  converted_at TIMESTAMP,
  status ENUM('new', 'contacted', 'qualified', 'converted', 'rejected') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 APIs Requeridas

### **1. Public Landing APIs**

#### **GET /api/landing/plans**
```json
{
  "plans": [
    {
      "id": 1,
      "name": "Starter",
      "slug": "starter",
      "price": 29.00,
      "yearlyPrice": 290.00,
      "currency": "EUR",
      "isPopular": false,
      "features": [
        "Hasta 100 clientes",
        "Facturación básica",
        "Agenda simple",
        "Soporte por email"
      ],
      "limits": {
        "clients": 100,
        "invoices": 50,
        "storage": "1GB"
      }
    }
  ]
}
```

#### **POST /api/landing/leads**
```json
// Request
{
  "email": "user@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Tech Corp",
  "phone": "+34123456789",
  "message": "Interested in demo",
  "leadType": "demo",
  "utmData": {
    "utm_source": "google",
    "utm_campaign": "summer2024"
  }
}

// Response
{
  "success": true,
  "message": "Lead captured successfully",
  "leadId": 123
}
```

### **2. Authentication APIs**

#### **POST /api/auth/register**
```json
// Request
{
  "email": "user@company.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Tech Corp",
  "teamSize": "11-50",
  "planSlug": "professional"
}

// Response
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "token": "jwt_token_here",
  "user": {
    "id": 123,
    "email": "user@company.com",
    "firstName": "John",
    "status": "trial"
  }
}
```

#### **POST /api/auth/verify-email**
#### **POST /api/auth/login**
#### **POST /api/auth/forgot-password**
#### **POST /api/auth/reset-password**

### **3. Subscription Management APIs**

#### **POST /api/subscriptions/create**
```json
// Request
{
  "planId": 2,
  "billingPeriod": "yearly",
  "paymentMethodId": "pm_stripe_id"
}

// Response
{
  "success": true,
  "subscription": {
    "id": 456,
    "status": "trialing",
    "trialEnd": "2024-09-30T23:59:59Z",
    "nextBilling": "2024-09-30T00:00:00Z"
  },
  "clientSecret": "stripe_client_secret"
}
```

#### **GET /api/subscriptions/current**
#### **POST /api/subscriptions/upgrade**
#### **POST /api/subscriptions/cancel**
#### **POST /api/subscriptions/reactivate**

### **4. Payment APIs**

#### **POST /api/payments/setup-intent**
```json
{
  "clientSecret": "seti_stripe_client_secret",
  "setupIntentId": "seti_stripe_id"
}
```

#### **POST /api/payments/payment-method**
#### **GET /api/payments/methods**
#### **DELETE /api/payments/methods/:id**

### **5. Dashboard APIs**

#### **GET /api/dashboard/stats**
```json
{
  "subscription": {
    "plan": "Professional",
    "status": "active",
    "nextBilling": "2024-10-01",
    "amount": 59.00
  },
  "usage": {
    "clients": { "current": 45, "limit": 500 },
    "invoices": { "current": 123, "limit": 1000 },
    "storage": { "current": "2.3GB", "limit": "10GB" }
  }
}
```

#### **GET /api/dashboard/invoices**
#### **GET /api/dashboard/usage**

---

## 💳 Integración con Stripe

### **Webhooks Requeridos**
```javascript
// /api/webhooks/stripe
const webhookHandlers = {
  'invoice.payment_succeeded': handlePaymentSucceeded,
  'invoice.payment_failed': handlePaymentFailed,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionCanceled,
  'customer.subscription.trial_will_end': handleTrialEnding,
  'payment_method.attached': handlePaymentMethodAdded
};
```

### **Productos y Precios en Stripe**
```json
{
  "products": [
    {
      "name": "Orbyt Starter",
      "description": "Plan básico para pequeños negocios",
      "prices": [
        { "recurring": "month", "amount": 2900 },
        { "recurring": "year", "amount": 29000 }
      ]
    },
    {
      "name": "Orbyt Professional",
      "description": "Plan avanzado para empresas en crecimiento",
      "prices": [
        { "recurring": "month", "amount": 5900 },
        { "recurring": "year", "amount": 59000 }
      ]
    }
  ]
}
```

---

## 📧 Sistema de Comunicaciones

### **Email Templates Requeridos**
1. **Bienvenida y verificación de email**
2. **Confirmación de suscripción**
3. **Recordatorio de fin de trial**
4. **Confirmación de pago**
5. **Fallo en el pago**
6. **Cancelación de suscripción**
7. **Facturas mensuales**
8. **Newsletter y updates**

### **Notificaciones en tiempo real**
- WebSocket para notificaciones de pago
- Push notifications para móvil
- In-app notifications en dashboard

---

## 📊 Analytics y Métricas

### **KPIs a Trackear**
- Conversion rate por fuente de tráfico
- Cost per acquisition (CPA)
- Monthly recurring revenue (MRR)
- Customer lifetime value (LTV)
- Churn rate
- Trial to paid conversion rate

### **APIs de Analytics**
```json
// GET /api/analytics/conversions
{
  "period": "last_30_days",
  "data": {
    "visitors": 5420,
    "leads": 342,
    "trials": 89,
    "paid": 23,
    "conversionRate": 25.84
  }
}
```

---

## 🔒 Seguridad y Compliance

### **Medidas de Seguridad**
- Rate limiting en todas las APIs
- Encriptación de datos sensibles
- Validación estricta de inputs
- Logs de auditoría para pagos
- 2FA opcional para cuentas premium

### **GDPR Compliance**
- Consentimiento explícito para marketing
- Derecho al olvido (eliminación de datos)
- Portabilidad de datos
- Privacy policy y términos de servicio

---

## 🚀 Despliegue y Infraestructura

### **Variables de Entorno Necesarias**
```env
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.xxx

# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=24h

# App
APP_URL=https://orbyt.com
DASHBOARD_URL=https://app.orbyt.com
```

### **Servicios Adicionales Requeridos**
- Redis para cache y sessions
- S3 para almacenamiento de facturas
- CDN para assets estáticos
- Monitoring (Sentry, DataDog)
- Analytics (Google Analytics, Mixpanel)

---

## 📋 Checklist de Implementación

### **Fase 1: Core Backend (2 semanas)**
- [ ] Setup base de datos y migraciones
- [ ] Sistema de autenticación completo
- [ ] CRUD de planes de suscripción
- [ ] APIs básicas de landing

### **Fase 2: Payments & Subscriptions (2 semanas)**
- [ ] Integración completa con Stripe
- [ ] Gestión de suscripciones y pagos
- [ ] Sistema de facturación
- [ ] Webhooks y manejo de eventos

### **Fase 3: Dashboard & Analytics (1 semana)**
- [ ] Dashboard APIs
- [ ] Sistema de métricas
- [ ] Reportes y exportación

### **Fase 4: Comunicaciones & Marketing (1 semana)**
- [ ] Email templates y automatización
- [ ] Lead nurturing system
- [ ] Analytics y tracking

---

## 💡 Consideraciones Adicionales

### **Escalabilidad**
- Arquitectura microservicios preparada
- Cache distribuido con Redis
- CDN para contenido estático
- Auto-scaling en cloud

### **Testing**
- Unit tests para lógica de negocio crítica
- Integration tests para APIs de pago
- E2E tests para flujo completo de suscripción

### **Monitoring**
- Health checks para todos los servicios
- Alertas para pagos fallidos
- Monitoreo de performance de APIs críticas
- Dashboards de business metrics

---

**Próximo paso**: Una vez implementadas estas especificaciones, el frontend podrá consumir todas estas APIs para crear una experiencia de usuario fluida y profesional en la landing page de Orbyt.