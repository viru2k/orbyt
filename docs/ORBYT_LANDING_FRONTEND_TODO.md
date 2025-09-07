# 🚀 ORBYT Landing Frontend - TODO de Implementación

## ✅ BACKEND COMPLETADO
El backend de pagos está **100% implementado** con:
- ✅ Integración Redsys real (firma HMAC-SHA256, 3DES)
- ✅ Integración Stripe real (SDK oficial)
- ✅ Webhooks seguros para ambos proveedores
- ✅ Base de datos completa con transacciones
- ✅ 25+ endpoints REST disponibles
- ✅ Documentación API automática en `/api/docs`

---

## 📂 ARCHIVOS FRONTEND A CREAR/ACTUALIZAR

### 1. **SERVICIO PRINCIPAL** - `src/app/services/orbyt-landing-api.service.ts`
```bash
# CREAR este archivo con todas las llamadas API
# Ver contenido completo en ORBYT_LANDING_FRONTEND_INTEGRATION_GUIDE.md
```

### 2. **ENVIRONMENTS** - `src/environments/`
```typescript
// environment.ts
export const environment = {
  production: false,
  landingApiUrl: 'http://localhost:3001/api',
  stripePublicKey: 'pk_test_...' // Desde backend .env
};

// environment.prod.ts
export const environment = {
  production: true,
  landingApiUrl: 'https://landing-api.orbyt.com/api',
  stripePublicKey: 'pk_live_...'
};
```

### 3. **ACTUALIZAR** - `src/app/pages/checkout/checkout.component.ts`
Reemplazar el método `mockProcessPayment()` con integración real:

```typescript
// CAMBIAR ESTA LÍNEA:
await this.mockProcessPayment();

// POR ESTA IMPLEMENTACIÓN:
await this.processRealPayment();

private async processRealPayment(): Promise<void> {
  const userData = this.checkoutData()?.userData;
  const country = userData?.country || 'ES';
  
  // 1. Crear setup intent
  const setupResponse = await this.landingApi.createPaymentSetup(
    this.landingApi.getPreferredPaymentProvider(country)
  ).toPromise();

  // 2. Procesar según proveedor
  if (setupResponse.provider === 'redsys') {
    this.processRedsysPayment(setupResponse);
  } else {
    await this.processStripePayment(setupResponse);
  }
}

private processRedsysPayment(setup: PaymentSetupResponse): void {
  // Crear formulario oculto para Redsys
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = setup.setupIntent.url!;
  
  Object.entries(setup.setupIntent.parameters!).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  
  document.body.appendChild(form);
  form.submit(); // Redirige a Redsys
}

private async processStripePayment(setup: PaymentSetupResponse): Promise<void> {
  const stripe = await loadStripe(environment.stripePublicKey);
  
  const { error } = await stripe!.confirmCardSetup(
    setup.setupIntent.clientSecret!,
    {
      payment_method: {
        card: this.cardElement, // Necesitas crear Stripe Elements
        billing_details: {
          name: this.paymentForm.value.cardholderName
        }
      }
    }
  );
  
  if (error) {
    throw new Error(error.message);
  }
}
```

### 4. **ACTUALIZAR** - `src/app/pages/pricing/pricing.component.ts`
Integrar con API real:

```typescript
async ngOnInit() {
  // CAMBIAR: this.plans = this.mockPlans;
  
  // POR:
  this.landingApi.getSubscriptionPlans().subscribe(plans => {
    this.plans = plans;
  });
}
```

### 5. **ACTUALIZAR** - `src/app/pages/auth/register/register.component.ts`
Integrar registro real:

```typescript
async onSubmit() {
  if (this.registerForm.valid) {
    try {
      const registerData: RegisterDto = {
        ...this.registerForm.value,
        planSlug: this.selectedPlan.slug
      };
      
      const response = await this.landingApi.register(registerData).toPromise();
      
      // Guardar token
      this.landingApi.saveToken(response.token);
      
      // Redirigir a onboarding/checkout
      this.router.navigate(['/checkout']);
      
    } catch (error) {
      // Manejar error
      console.error('Registration error:', error);
    }
  }
}
```

### 6. **CREAR** - `src/app/pages/dashboard/dashboard.component.ts`
Nuevo dashboard de usuario:

```typescript
@Component({
  template: `
    <div class="user-dashboard">
      <div class="subscription-card">
        <h3>Tu Suscripción</h3>
        <div class="status" [ngClass]="stats?.subscription.status">
          {{ stats?.subscription.status }}
        </div>
        <div class="plan">{{ stats?.subscription.plan }}</div>
        <div class="next-billing">
          Próxima facturación: {{ stats?.subscription.nextBilling | date }}
        </div>
        <div class="amount">{{ stats?.subscription.amount }}€</div>
      </div>
      
      <div class="usage-section">
        <h3>Uso Actual</h3>
        <div class="usage-item">
          Clientes: {{ stats?.usage.clients.current }}/{{ stats?.usage.clients.limit }}
        </div>
        <div class="usage-item">
          Facturas: {{ stats?.usage.invoices.current }}/{{ stats?.usage.invoices.limit }}
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  stats?: DashboardStats;
  
  constructor(private landingApi: OrbitLandingApiService) {}
  
  async ngOnInit() {
    this.stats = await this.landingApi.getDashboardStats().toPromise();
  }
}
```

---

## 🔧 DEPENDENCIAS A INSTALAR

```bash
cd orbyt-landing
npm install @stripe/stripe-js
npm install @angular/common/http  # Si no está instalado
```

---

## 🛠️ CONFIGURACIÓN ADICIONAL

### 1. **HTTP Interceptor** - `src/app/interceptors/auth.interceptor.ts`
```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('orbyt_landing_token');
    
    if (token) {
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      return next.handle(authReq);
    }
    
    return next.handle(req);
  }
}
```

### 2. **App Config** - `src/app/app.config.ts`
```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros providers
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
```

---

## 🚦 FLUJO DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Setup Básico
1. ✅ Crear `orbyt-landing-api.service.ts`
2. ✅ Configurar environments
3. ✅ Instalar dependencias
4. ✅ Configurar HTTP interceptor

### Fase 2: Páginas Principales
1. ✅ Actualizar `pricing.component.ts` (cargar planes reales)
2. ✅ Actualizar `register.component.ts` (registro real)
3. ✅ Actualizar `checkout.component.ts` (pagos reales)

### Fase 3: Dashboard y Gestión
1. ✅ Crear `dashboard.component.ts` 
2. ✅ Implementar gestión de métodos de pago
3. ✅ Historial de transacciones

### Fase 4: Testing y Refinamiento
1. ✅ Probar flujo completo de registro
2. ✅ Probar pagos con Redsys (España)
3. ✅ Probar pagos con Stripe (internacional)
4. ✅ Manejar casos de error

---

## 🔗 URLs DEL BACKEND

### Desarrollo
- **API Base**: http://localhost:3001/api
- **Documentación**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/health

### Producción (cuando esté deployed)
- **API Base**: https://landing-api.orbyt.com/api
- **Documentación**: https://landing-api.orbyt.com/api/docs

---

## ⚡ TESTING RÁPIDO

Para probar que el backend funciona:

```bash
# 1. Verificar que el servicio esté corriendo
curl http://localhost:3001/api/health

# 2. Obtener planes de suscripción
curl http://localhost:3001/api/landing/plans

# 3. Verificar documentación API
# Abrir en navegador: http://localhost:3001/api/docs
```

---

## 📝 NOTAS IMPORTANTES

1. **El backend YA ESTÁ COMPLETO** - Solo falta conectar frontend
2. **Redsys es prioritario** - Para usuarios españoles (90% market share)
3. **Stripe es fallback** - Para usuarios internacionales
4. **JWT Authentication** - Todas las APIs de pagos requieren token
5. **HTTPS necesario** - Para producción con pagos reales

---

**📅 Estado**: Backend ✅ Completado | Frontend ⏳ Pendiente implementación
**🎯 Siguiente paso**: Crear el servicio API y actualizar checkout.component.ts