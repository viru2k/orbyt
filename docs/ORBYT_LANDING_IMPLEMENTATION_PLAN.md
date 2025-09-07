# ORBYT Landing Page - Plan de Implementación Completo

## 🎯 Objetivo
Desarrollar un microservicio independiente para el backend de la landing page de ORBYT, integrando procesadores de pago populares en España y gestionando registro de usuarios, suscripciones y billing.

---

## 🏗️ Arquitectura de Microservicios

### Servicios Propuestos

#### 1. **orbyt-landing-service** (Nuevo)
- **Puerto**: 3001
- **Responsabilidades**:
  - Autenticación de usuarios de landing
  - Gestión de leads y conversiones
  - Procesamiento de suscripciones
  - Integración con procesadores de pago españoles
  - Dashboard básico de suscriptores

#### 2. **orbyt-backoffice-hub** (Existente) 
- **Puerto**: 3000
- **Responsabilidades**: 
  - Gestión completa de negocio (productos, servicios, facturas)
  - Sistema de agenda y citas
  - CRM avanzado
  - Reportes y analytics empresariales

#### 3. **orbyt-gateway** (Futuro)
- API Gateway para enrutamiento entre servicios
- Autenticación centralizada con JWT compartido
- Rate limiting y monitoreo

---

## 💳 Estrategia de Pagos para España

### Procesadores Seleccionados

#### 1. **Redsys** (Prioritario - Mercado Local)
- **Cobertura**: 90% de bancos españoles
- **Ventajas**: 
  - Aceptación universal en España
  - Comisiones competitivas para mercado local
  - Cumplimiento PCI DSS nativo
- **Desventajas**: 
  - Documentación limitada en inglés
  - API menos moderna que competidores
- **Implementación**: Redsys TPV Virtual

#### 2. **Stripe** (Secundario - Internacional)
- **Cobertura**: Global con soporte EUR
- **Ventajas**:
  - Documentación excelente
  - APIs modernas y SDKs completos
  - Dashboard avanzado
  - Soporte para SCA (Strong Customer Authentication)
- **Implementación**: Stripe Payment Intents + Subscriptions

#### 3. **Bizum** (Futuro - Mobile Payments)
- **Cobertura**: 25.3M usuarios en España
- **Implementación**: A través de Redsys o integraciones bancarias directas

### Flujo de Pagos Recomendado
1. **Preferencia por defecto**: Redsys (tarjetas españolas)
2. **Fallback automático**: Stripe (tarjetas internacionales)
3. **Opción móvil**: Bizum (futura implementación)

---

## 📊 Base de Datos - Nuevo Microservicio

### Schema Propuesto: `orbyt_landing_db`

```sql
-- Usuarios de Landing (separados del backoffice)
CREATE TABLE landing_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(200),
  phone VARCHAR(20),
  country VARCHAR(50) DEFAULT 'ES',
  industry VARCHAR(100),
  team_size ENUM('1', '2-10', '11-50', '51-200', '200+'),
  lead_source VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  status ENUM('lead', 'trial', 'active', 'cancelled', 'expired') DEFAULT 'lead',
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  redsys_customer_id VARCHAR(100), -- ID de cliente en Redsys
  stripe_customer_id VARCHAR(100), -- ID de cliente en Stripe
  preferred_payment_method ENUM('redsys', 'stripe') DEFAULT 'redsys',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Planes de Suscripción
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price_eur DECIMAL(10,2) NOT NULL,
  yearly_price_eur DECIMAL(10,2),
  billing_period ENUM('monthly', 'yearly') DEFAULT 'monthly',
  features JSON,
  limits JSON,
  redsys_product_id VARCHAR(100), -- ID del producto en Redsys
  stripe_price_id VARCHAR(100), -- ID del precio en Stripe
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suscripciones de Usuarios
CREATE TABLE user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES landing_users(id),
  plan_id INTEGER REFERENCES subscription_plans(id),
  payment_provider ENUM('redsys', 'stripe') NOT NULL,
  provider_subscription_id VARCHAR(100), -- ID en Redsys o Stripe
  provider_customer_id VARCHAR(100),
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

-- Métodos de Pago Multi-Proveedor
CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES landing_users(id),
  provider ENUM('redsys', 'stripe') NOT NULL,
  provider_payment_method_id VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'card', -- card, sepa, bizum
  last_four VARCHAR(4),
  brand VARCHAR(20), -- visa, mastercard, etc.
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transacciones de Pago
CREATE TABLE payment_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES landing_users(id),
  subscription_id INTEGER REFERENCES user_subscriptions(id),
  provider ENUM('redsys', 'stripe') NOT NULL,
  provider_transaction_id VARCHAR(100),
  amount_eur DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  payment_method_id INTEGER REFERENCES payment_methods(id),
  failure_reason TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads y Conversiones
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(200),
  phone VARCHAR(20),
  message TEXT,
  lead_type ENUM('contact', 'demo', 'newsletter', 'trial') NOT NULL,
  source VARCHAR(100),
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

## 🔌 APIs del Microservicio

### Estructura de Endpoints

```
Base URL: http://localhost:3001/api

Public Endpoints:
├── GET    /landing/plans           # Planes de suscripción públicos
├── POST   /landing/leads           # Captura de leads
├── POST   /auth/register           # Registro con plan seleccionado
├── POST   /auth/login              # Login de usuarios landing
├── POST   /auth/verify-email       # Verificación de email
└── POST   /auth/forgot-password    # Recuperación de contraseña

Authenticated Endpoints:
├── GET    /subscriptions/current   # Suscripción actual del usuario
├── POST   /subscriptions/create    # Crear nueva suscripción
├── PUT    /subscriptions/upgrade   # Cambiar plan
├── POST   /subscriptions/cancel    # Cancelar suscripción
├── GET    /payments/methods        # Métodos de pago del usuario
├── POST   /payments/redsys/setup   # Setup método de pago Redsys
├── POST   /payments/stripe/setup   # Setup método de pago Stripe
├── GET    /dashboard/stats         # Stats básicas del usuario
└── GET    /dashboard/invoices      # Historial de facturas

Webhook Endpoints:
├── POST   /webhooks/redsys         # Webhooks de Redsys
└── POST   /webhooks/stripe         # Webhooks de Stripe
```

---

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: NestJS + TypeScript
- **Base de datos**: PostgreSQL
- **ORM**: TypeORM  
- **Cache**: Redis
- **Autenticación**: JWT + Passport
- **Validación**: class-validator + class-transformer
- **Documentación**: Swagger/OpenAPI

### Integraciones de Pago
- **Redsys**: SDK oficial + TPV Virtual
- **Stripe**: stripe-node SDK
- **Webhooks**: Validación de signatures

### Testing
- **Unit**: Jest
- **E2E**: Supertest
- **Payments**: Sandbox de Redsys + Stripe Test Mode

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### ✅ Fase 1: Setup Inicial (Semana 1)
- [ ] Crear nuevo repositorio `orbyt-landing-service`
- [ ] Configurar estructura base NestJS
- [ ] Setup PostgreSQL y Redis
- [ ] Configurar Docker Compose para desarrollo
- [ ] Setup CI/CD pipeline básico
- [ ] Configurar variables de entorno

### ✅ Fase 2: Autenticación y Usuarios (Semana 2)
- [ ] Implementar LandingUser entity
- [ ] Crear AuthModule con JWT
- [ ] Endpoints de registro/login/verificación
- [ ] Sistema de recuperación de contraseña
- [ ] Middleware de autenticación
- [ ] Testing de autenticación

### ✅ Fase 3: Gestión de Planes (Semana 2)
- [ ] Crear SubscriptionPlan entity
- [ ] API pública de planes
- [ ] Panel admin para gestión de planes
- [ ] Seeding de planes iniciales
- [ ] Validaciones de negocio

### ✅ Fase 4: Integración Redsys (Semana 3)
- [ ] Investigar SDK oficial Redsys
- [ ] Implementar RedsysService
- [ ] Setup TPV Virtual en sandbox
- [ ] Crear endpoints de setup de pagos
- [ ] Implementar webhooks de Redsys
- [ ] Testing con tarjetas de prueba

### ✅ Fase 5: Integración Stripe (Semana 3)
- [ ] Configurar Stripe SDK
- [ ] Implementar StripeService
- [ ] Setup Payment Intents
- [ ] Configurar Subscriptions
- [ ] Implementar webhooks de Stripe
- [ ] Testing con Stripe Test Mode

### ✅ Fase 6: Gestión de Suscripciones (Semana 4)
- [ ] UserSubscription entity
- [ ] Lógica de upgrade/downgrade
- [ ] Manejo de períodos de prueba
- [ ] Cancelación y reactivación
- [ ] Sincronización con proveedores de pago
- [ ] Testing de flujos completos

### ✅ Fase 7: Sistema de Facturación (Semana 5)
- [ ] Generación automática de invoices
- [ ] PDF generation para facturas
- [ ] Historial de pagos
- [ ] Gestión de impuestos (IVA español)
- [ ] Email notifications
- [ ] Reportes básicos

### ✅ Fase 8: Leads y Analytics (Semana 6)
- [ ] Lead capture system
- [ ] UTM tracking
- [ ] Conversion analytics
- [ ] Email automation básica
- [ ] Dashboard de métricas
- [ ] Integración con Google Analytics

### ✅ Fase 9: Testing y QA (Semana 7)
- [ ] Testing E2E completo
- [ ] Testing de webhooks
- [ ] Load testing básico
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentación técnica

### ✅ Fase 10: Despliegue y Monitoreo (Semana 8)
- [ ] Setup producción (AWS/DigitalOcean)
- [ ] Configurar monitoring (Sentry)
- [ ] Health checks
- [ ] Backup strategy
- [ ] SSL certificates
- [ ] Go live checklist

---

## 🔒 Consideraciones de Seguridad

### Redsys Específico
- Validación obligatoria de Ds_Signature
- Whitelist de IPs de Redsys para webhooks
- Encriptación de datos sensibles con clave del comercio

### Stripe Específico  
- Validación de webhook signatures
- Uso de Payment Intents (no Charges deprecados)
- SCA compliance para Europa

### General
- Rate limiting en endpoints críticos
- Validación estricta de inputs
- Audit logs para transacciones
- Encriptación de PII en base de datos

---

## 💰 Configuración de Costos

### Comisiones Estimadas
- **Redsys**: ~1.5-2% + €0.15 por transacción
- **Stripe**: 1.4% + €0.25 (tarjetas EU), 2.9% + €0.25 (internacional)
- **Bizum**: ~€0.50 por transacción (a través de bancos)

### Planes Sugeridos (Precios en EUR)
```json
{
  "starter": {
    "monthly": 29.00,
    "yearly": 290.00
  },
  "professional": {
    "monthly": 59.00,
    "yearly": 590.00  
  },
  "enterprise": {
    "monthly": 99.00,
    "yearly": 990.00
  }
}
```

---

## 📊 Métricas Clave a Implementar

### Business KPIs
- **MRR** (Monthly Recurring Revenue)
- **Churn Rate** por plan y método de pago
- **LTV** (Customer Lifetime Value)
- **CAC** (Customer Acquisition Cost)
- **Trial to Paid** conversion rate

### Technical KPIs
- **Payment Success Rate** por proveedor
- **API Response Times**
- **Webhook Processing Time**
- **Error Rates** por endpoint
- **Database Performance**

---

## 🌍 Variables de Entorno

```env
# App
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:4200

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/orbyt_landing_db
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Redsys (Sandbox)
REDSYS_MERCHANT_CODE=999008881
REDSYS_TERMINAL=001
REDSYS_SECRET_KEY=sq7HjrUOBfKmC576ILgskD5srU870gJ7
REDSYS_SANDBOX_URL=https://sis-t.redsys.es:25443/sis/realizarPago

# Stripe (Test)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SendGrid/SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.xxx
FROM_EMAIL=noreply@orbyt.com

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 🚀 Próximos Pasos Inmediatos

1. **Crear repositorio**: `orbyt-landing-service`
2. **Setup inicial**: NestJS + Docker + PostgreSQL
3. **Investigación técnica**: Documentación oficial de Redsys TPV Virtual
4. **Prototipo**: Endpoint básico de planes + autenticación JWT
5. **Spike técnico**: Integración de prueba con Redsys Sandbox

---

**Fecha de creación**: 30 de Agosto, 2025  
**Próxima revisión**: Cada viernes durante implementación  
**Responsable**: Equipo Backend  
**Estado**: 📋 PLAN READY - Listo para comenzar implementación