# ORBYT Landing Frontend - Contexto para Agentes IA

## ¿Qué es este servicio?

**ORBYT Landing Frontend** es la **landing page Angular** diseñada para captar leads, mostrar planes de suscripción y convertir visitantes en clientes de pago. Es la primera interacción que tienen los usuarios potenciales con ORBYT.

## Información Rápida

- **Tecnología**: Angular 19 + PrimeNG (compartido con orbyt principal)
- **Puerto**: 4201 (desarrollo)
- **Usuarios**: Visitantes anónimos, leads potenciales
- **Propósito**: Marketing, captación, conversión a pago

## ¿Qué hace este servicio?

### Landing Page Completa
1. **Homepage** - Hero section, features, benefits, social proof
2. **Pricing Page** - Planes con precios claros para mercado español
3. **Features Page** - Funcionalidades detalladas del SaaS
4. **About Us** - Historia de empresa, equipo, misión
5. **Contact** - Formularios de contacto y solicitud de demo
6. **Legal Pages** - Términos, privacidad, cookies (GDPR)

### Conversión & Lead Generation
1. **Lead Forms** - Captura de interés con formularios optimizados
2. **Newsletter** - Suscripción a contenido marketing
3. **Demo Requests** - Solicitudes de demonstraciones
4. **Pricing Calculator** - Calculadora interactiva de costos
5. **Social Proof** - Testimonios, casos de éxito, estadísticas

### User Journey
1. **Awareness** - Landing page con información atractiva
2. **Interest** - Formularios de contacto y newsletter
3. **Consideration** - Pricing page y comparación de planes
4. **Trial** - Registro y start de trial gratuito
5. **Conversion** - Configuración de pago y suscripción

## Dependencias de Otros Servicios

### 🔴 DEPENDENCIA CRÍTICA: orbyt-landing-service
```
orbyt-landing (4201) → orbyt-landing-service (3001)
```
- **Relación**: Frontend-Backend especializado en conversión
- **Comunicación**: HTTP REST APIs
- **Propósito**: Consumir todos los endpoints de marketing y conversión

#### APIs que CONSUME del landing service:
- `GET /api/landing/plans` - Lista de planes para pricing page
- `GET /api/landing/plans/featured` - Planes destacados para homepage  
- `POST /api/landing/leads` - Envío de formularios de contacto
- `POST /api/landing/newsletter` - Suscripciones newsletter
- `GET /api/landing/stats` - Estadísticas para social proof
- `POST /api/auth/register` - Registro con selección de plan
- `POST /api/payments/setup-intent` - Inicio proceso de pago
- `GET /api/auth/me` - Perfil post-registro

### ⚪ COEXISTE CON: orbyt (frontend principal)
```
Mismo monorepo Nx, diferentes propósitos
```
- **orbyt-landing (4201)**: Marketing y conversión
- **orbyt (4200)**: SaaS application para clientes existentes
- **Shared**: Componentes UI, estilos, configuración

### ⚪ INDEPENDIENTE: backoffice-hub
- **NO se conecta directamente**
- Los usuarios convertidos aquí van a orbyt-landing-service
- Después migran a backoffice-hub (integración futura)

## Tipos de Usuarios

### 1. Visitantes Anónimos (Primary Target)
- **Quién**: Empresarios explorando soluciones SaaS
- **Intereses**: Gestión de salones, clínicas, spas
- **Casos de uso**:
  - Conocer qué hace ORBYT
  - Ver precios y planes disponibles
  - Comparar features vs competencia
  - Dejar información de contacto
  - Suscribirse a newsletter

### 2. Leads Interesados
- **Quién**: Usuarios que dejaron información
- **Siguiente paso**: Seguimiento de sales team
- **Casos de uso**:
  - Recibir emails de nurturing
  - Agendar demos personalizadas
  - Evaluar si ORBYT se adapta a su negocio

### 3. Usuarios Listos para Trial
- **Quién**: Convinced prospects listos para probar
- **Siguiente paso**: Registro y trial gratuito
- **Casos de uso**:
  - Registrarse con plan seleccionado
  - Empezar trial de 14 días
  - Configurar método de pago

## Configuración de Desarrollo

### Pre-requisitos
1. **orbyt-landing-service debe estar corriendo** en puerto 3001
2. **Mismo setup que orbyt principal** (Nx monorepo)
3. Node.js 18+ y Angular CLI

### Comandos Importantes
```bash
# Instalar dependencias (desde raíz orbyt/)
npm install

# Desarrollo landing page (puerto 4201)
nx serve orbyt-landing

# Build landing page
nx build orbyt-landing

# Ejecutar junto con app principal
nx serve orbyt & nx serve orbyt-landing

# Tests específicos de landing
nx test orbyt-landing
```

### Configuración de Proxy
El landing frontend necesita proxy hacia landing-service:
```json
// proxy.conf.json (específico para landing)
{
  "/api/*": {
    "target": "http://localhost:3001",  // ← Landing service, NO backoffice
    "secure": false,
    "changeOrigin": true
  }
}
```

## Arquitectura de Páginas

### Estructura de Rutas
```
/                    # Homepage con hero y features
/pricing             # Planes y precios
/features            # Funcionalidades detalladas
/about              # About us, equipo, misión
/contact            # Formularios de contacto
/demo               # Solicitud de demo
/register           # Registro con selección de plan
/login              # Login para usuarios existentes
/dashboard          # Dashboard básico post-registro
/legal/terms        # Términos de servicio
/legal/privacy      # Política de privacidad
/legal/cookies      # Política de cookies
```

### Componentes Clave
```
src/app/
├── pages/
│   ├── home/           # Landing principal
│   ├── pricing/        # Pricing page optimizada
│   ├── features/       # Features showcase
│   ├── about/          # About company
│   ├── contact/        # Contact forms
│   └── auth/           # Register/login
├── components/
│   ├── hero/           # Hero section
│   ├── feature-grid/   # Features grid
│   ├── pricing-cards/  # Pricing cards
│   ├── testimonials/   # Social proof
│   └── forms/          # Lead forms
└── shared/             # Shared con orbyt principal
```

## Para Agentes IA: Guías Rápidas

### ✅ Qué PUEDES hacer aquí:
- Crear landing pages optimizadas para conversión
- Implementar formularios de captura de leads
- Crear pricing pages con planes españoles (EUR)
- Optimizar UX para conversión
- Implementar tracking de analytics (Google Analytics, etc)
- Crear páginas legales GDPR compliant
- A/B testing de elementos de conversión
- SEO optimization para mercado español

### ❌ Qué NO hacer aquí:
- Lógica de negocio compleja (va en landing-service)
- Funcionalidades del SaaS (va en orbyt principal)
- Procesamiento de pagos (va en landing-service)
- APIs backend (va en orbyt-landing-service)

### 🔧 Workflow típico:
1. **Crear página/componente** de marketing
2. **Conectar con API** del landing-service
3. **Optimizar para conversión** (CRO)
4. **Testing A/B** de variantes
5. **Analytics & tracking** de performance

### 🚨 Puntos críticos:
- **Conectar a landing-service (3001)** NO a backoffice-hub (3000)
- **Conversión focused** - cada elemento debe convertir
- **Mobile first** - mayoría del tráfico español es móvil
- **GDPR compliant** - banners de cookies, política de privacidad
- **SEO optimizado** - títulos, metas, structured data
- **Performance** - landing debe cargar rápido

### 🎯 Principios de diseño:
- **Conversión first**: Todo elemento debe tener propósito de conversión
- **Trust building**: Social proof, testimonios, garantías
- **Clear value prop**: Beneficios claros y diferenciados
- **Spanish market**: Precios en EUR, contenido localizado
- **Mobile optimized**: Responsive design impecable
- **GDPR ready**: Legal compliance desde día uno

## Métricas Importantes

### Conversion Funnel
1. **Visitor → Lead**: % de visitantes que dejan información
2. **Lead → Trial**: % de leads que se registran para trial
3. **Trial → Paid**: % de trials que se convierten en pago
4. **Overall CVR**: % total de visitor-to-paid

### Key Pages Performance
- **Homepage**: Bounce rate, time on page, scroll depth
- **Pricing**: Plan selection rate, pricing page abandonment
- **Contact**: Form completion rate, lead quality
- **Register**: Registration completion rate, drop-off points

## Estado Actual

**Status**: En desarrollo activo para soporte del landing-service
- ⏳ Homepage con hero y features
- ⏳ Pricing page con planes españoles
- ⏳ Formularios de contacto y leads
- ⏳ Páginas legales GDPR
- ⏳ Registration flow con trial
- ⏳ Dashboard básico post-registro

### Prioridades:
1. **Conectividad** con orbyt-landing-service
2. **Pricing page** optimizada para España
3. **Forms optimization** para lead capture
4. **GDPR compliance** completo
5. **SEO & Analytics** setup

**Es el frontend de marketing y conversión del ecosistema ORBYT.**