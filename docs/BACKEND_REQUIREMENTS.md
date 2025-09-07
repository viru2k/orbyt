# Requerimientos Backend - Mejoras Configuración Agenda

## Contexto
Se necesita reorganizar la configuración de agenda para mejorar la UX y gestión por usuario.

## Cambios Requeridos

### 1. Días Festivos
- Mover gestión de días festivos desde modal emergente a sección de configuración
- Mantener endpoints existentes: `/agenda/holiday` y `/agenda/holidays`

### 2. Configuración por Usuario
- Los días habilitados deben ser configurables por usuario individual
- Mantener endpoint existente: `/agenda/config` (GET/PATCH)
- Verificar que `professionalId` en query param funcione correctamente

### 3. Nuevos Campos de Configuración (si no existen)
Verificar si estos campos están disponibles en `AgendaConfigResponseDto`:
- ✅ `slotDurationMinutes` - Ya existe
- ✅ `allowOverbooking` - Ya existe (como `allowOverbooking`)
- ❓ `allowFreeTimeSlots` - Verificar si existe o agregar
- ❓ `maxAdvanceBookingDays` - Verificar si existe o agregar
- ❓ `minAdvanceBookingHours` - Verificar si existe o agregar

### 4. Permisos de Usuario para Agenda
- Agregar campo `hasAgendaAccess: boolean` a `UserResponseDto`
- Agregar campo `hasAgendaAccess?: boolean` a `AdminUpdateUserDto` y `CreateSubUserDto`
- Solo usuarios con `hasAgendaAccess: true` deberían poder:
  - Ver el módulo de agenda
  - Crear/editar citas
  - Ver la configuración de agenda
- Usuarios sin permisos de agenda deberían recibir 403 Forbidden en endpoints de agenda

### 5. Validaciones
- Verificar permisos `canManageAgenda` en todos los endpoints de configuración
- Asegurar que solo usuarios con permisos puedan modificar configuración de otros usuarios
- Mantener la lógica actual de holidays por profesional
- Verificar `hasAgendaAccess` antes de permitir acceso a cualquier endpoint de agenda

## Endpoints Actuales (Validados)
- ✅ GET `/agenda/config?professionalId={id}` - Obtener configuración
- ✅ PATCH `/agenda/config?professionalId={id}` - Actualizar configuración
- ✅ GET `/agenda/holidays?professionalId={id}` - Obtener días festivos
- ✅ POST `/agenda/holiday` - Agregar día festivo
- ✅ DELETE `/agenda/holiday/{id}` - **IMPLEMENTADO** - Eliminar día festivo

## Nuevos Endpoints Requeridos

### Gestión de Permisos de Agenda de Usuario
- ❌ **AGREGAR**: Campo `hasAgendaAccess: boolean` a endpoints de usuario
- ❌ **MODIFICAR**: GET `/users/me` - Incluir `hasAgendaAccess` en respuesta
- ❌ **MODIFICAR**: GET `/users/group` - Incluir `hasAgendaAccess` en respuesta
- ❌ **MODIFICAR**: PATCH `/users/sub-user/{id}` - Permitir actualizar `hasAgendaAccess`
- ❌ **MODIFICAR**: POST `/users/sub-user` - Permitir establecer `hasAgendaAccess` inicial

## Inconsistencias en API (Para Corregir)
- ✅ **CORREGIDO**: `CreateHolidayDto` y `HolidayResponseDto` ahora usan campo `description` unificado

## Frontend Changes Needed
1. Crear componente de configuración con switches PrimeNG
2. Mover modal de días festivos a la nueva sección
3. Implementar gestión por usuario con selector de profesional

---

# Requerimientos Backend - Dashboard de Inventario

## Contexto
El dashboard de inventario actualmente usa datos mock. Se necesitan endpoints específicos para obtener métricas consolidadas de inventario.

## Endpoints Requeridos

### 1. Dashboard General de Inventario
**GET** `/inventory/dashboard/metrics`

Debe retornar métricas consolidadas para el dashboard:
```typescript
interface InventoryDashboardMetricsDto {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  overStockProducts: number;
  totalInventoryValue: number;
  movementsToday: number;
  trends: {
    products: { trend: number; label: string };
    lowStock: { trend: number; label: string };
    value: { trend: number; label: string };
    movements: { trend: number; label: string };
  };
}
```

### 2. Movimientos Recientes Generales
**GET** `/inventory/movements/recent?limit=10`

Debe retornar movimientos recientes de todos los productos (no solo de uno específico):
```typescript
interface RecentMovementsDto {
  movements: StockMovementResponseDto[];
}
```

### 3. Productos con Stock Bajo
**GET** `/inventory/products/low-stock?limit=10`

Debe retornar productos con stock por debajo del mínimo:
```typescript
interface LowStockProductDto {
  id: number;
  name: string;
  description?: string;
  currentStock: number;
  minStock: number;
  status: 'warning' | 'danger'; // warning: stock bajo, danger: sin stock
}

interface LowStockProductsDto {
  products: LowStockProductDto[];
}
```

### 4. Datos para Gráficos
**GET** `/inventory/dashboard/stock-distribution`

Para el gráfico de distribución del stock:
```typescript
interface StockDistributionDto {
  normal: number;    // productos con stock normal
  low: number;       // productos con stock bajo
  empty: number;     // productos sin stock  
  over: number;      // productos con sobrestock
}
```

**GET** `/inventory/dashboard/movements-chart?period=7d`

Para el gráfico de movimientos semanales:
```typescript
interface MovementsChartDto {
  labels: string[];        // ['Lun', 'Mar', 'Mié', ...]
  entriesData: number[];   // datos de entradas por día
  exitsData: number[];     // datos de salidas por día
}
```

## Lógica de Negocio Sugerida

1. **Stock Bajo**: `currentStock <= minStock * 1.2`
2. **Sin Stock**: `currentStock = 0`
3. **Sobrestock**: `currentStock > optimalStock * 1.5` (si existe campo optimalStock)
4. **Stock Normal**: el resto
5. **Tendencias**: comparar con período anterior (mes/semana según la métrica)

## Endpoints Existentes (Ya funcionando)
- ✅ GET `/stock/{productId}` - Movimientos por producto específico
- ✅ GET `/stock/{productId}/summary` - Resumen de stock por producto
- ✅ POST `/stock` - Crear movimiento de stock

## Estado de Implementación

**✅ COMPLETADO BACKEND**: Todos los endpoints específicos de dashboard de inventario están **IMPLEMENTADOS** y funcionando.

### Endpoints Implementados:
- ✅ **GET** `/inventory/dashboard/metrics` - Métricas consolidadas
- ✅ **GET** `/inventory/movements/recent?limit=10` - Movimientos recientes generales  
- ✅ **GET** `/inventory/products/low-stock?limit=10` - Productos con stock bajo
- ✅ **GET** `/inventory/dashboard/stock-distribution` - Distribución de stock para gráficos
- ✅ **GET** `/inventory/dashboard/movements-chart?period=7d` - Datos de movimientos para gráficos

### Swagger Documentation:
- ✅ **Regla de oro cumplida**: Todos los endpoints GET tienen DTOs expuestos en Swagger
- ✅ Decoradores @ApiResponse implementados con descripciones y tipos
- ✅ Endpoints validados y funcionando correctamente

**Frontend Status**: 
- ✅ Dashboard diseñado y estructurado
- ✅ Componentes funcionales con datos mock
- ✅ Integración con ProductStore y MovementStore
- ✅ **LISTO PARA INTEGRACIÓN** - Backend endpoints disponibles

**Pasos siguientes para completar integración**:
1. ✅ Backend implementado y documentado
2. 🔄 Frontend: `npm run openapi:generate` para actualizar modelos  
3. 🔄 Reemplazar lógica mock en `inventory-dashboard.component.ts` con llamadas a backend

---

# Requerimientos Backend - Sistema de Búsqueda de Productos

## Contexto
El frontend de productos actualmente carga todos los productos con GET `/products` y aplica filtros solo en el cliente. Esto no escala y no permite búsquedas eficientes.

## Problema Identificado
- **Endpoint actual**: `GET /products?userId={id}` - Solo permite filtrar por usuario
- **Comportamiento actual**: Carga todos los productos y filtra en frontend con PrimeNG
- **Limitación**: No hay búsqueda por texto en backend

## Endpoints Requeridos

### 1. Búsqueda de Productos con Parámetros
**GET** `/products/search`

```typescript
interface ProductSearchParams {
  query?: string;        // Búsqueda por nombre o descripción
  userId?: number;       // Filtrar por propietario (admin feature)  
  status?: string;       // Filtrar por estado (active, inactive, etc.)
  minPrice?: number;     // Precio mínimo
  maxPrice?: number;     // Precio máximo
  page?: number;         // Paginación
  limit?: number;        // Límite por página
  sortBy?: string;       // Campo para ordenar
  sortOrder?: 'asc' | 'desc'; // Orden de clasificación
}

interface ProductSearchResponseDto {
  products: ProductResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### 2. Actualizar Endpoint Existente (Opcional)
**Modificar** `GET /products` para incluir parámetros de búsqueda opcionales

```typescript
interface ProductControllerFindAll$Params {
  userId?: number;       // Existente
  query?: string;        // NUEVO: búsqueda por texto
  status?: string;       // NUEVO: filtro por estado
  page?: number;         // NUEVO: paginación
  limit?: number;        // NUEVO: límite
}
```

## Lógica de Búsqueda Requerida

1. **Búsqueda de Texto** (`query`):
   - Buscar en campos: `name`, `description`
   - Usar ILIKE o equivalente para búsqueda parcial insensible a mayúsculas
   - Ejemplo: `query="cafe"` encuentra "Café Premium", "Descafeinado", etc.

2. **Filtros**:
   - `status`: Filtrar por estado del producto
   - `userId`: Mantener funcionalidad existente (admin ve productos de sub-usuarios)
   - `minPrice`/`maxPrice`: Rango de precios

3. **Paginación**:
   - Implementar paginación real en base de datos
   - Retornar metadatos de paginación

4. **Ordenamiento**:
   - Permitir ordenar por: `name`, `currentPrice`, `status`, `createdAt`
   - Soporte para ASC/DESC

## Estado de Implementación

**❌ PENDIENTE BACKEND**: 
- Endpoint de búsqueda no implementado
- Paginación no disponible
- Filtros avanzados no soportados

**🔄 FRONTEND LISTO**: 
- Componente orb-table configurado para búsqueda
- ProductStore preparado para integración
- UI ya implementada con input de búsqueda

**Next Steps**:
1. ❌ Implementar endpoint `/products/search` en backend
2. ❌ Agregar soporte de paginación en base de datos
3. ❌ Actualizar documentación OpenAPI/Swagger
4. 🔄 Frontend: Ejecutar `npm run openapi:generate`
5. 🔄 Frontend: Actualizar ProductStore para usar nuevo endpoint

---

# Requerimientos Backend - Sistema de Pricing y Planes de Suscripción

## Contexto
El landing page actualmente usa precios hardcodeados. Se necesita implementar endpoints para gestión dinámica de planes de suscripción y pricing.

## Endpoints Requeridos para Landing Page

### 1. Obtener Planes de Suscripción Públicos
**GET** `/landing/plans`

Debe retornar todos los planes disponibles para mostrar en landing:
```typescript
interface SubscriptionPlan {
  id: string;
  slug: string;           // 'starter', 'business', 'enterprise'
  name: string;           // 'Emprendedores', 'Pequeñas Empresas', etc.
  description: string;    // Descripción del plan
  monthlyPrice: number;   // Precio mensual en euros
  yearlyPrice: number;    // Precio anual (con descuento)
  features: string[];     // Lista de características
  highlighted?: boolean;  // Plan destacado
  popular?: boolean;      // Plan más popular
  maxClients: number;     // Límite de clientes
  maxInvoices: number;    // Límite de facturas
  isActive: boolean;      // Plan activo/disponible
}
```

### 2. Obtener Planes Destacados (Featured)
**GET** `/landing/plans/featured`

Retornar solo planes marcados como `highlighted: true` o `popular: true` para sección preview.

### 3. Gestión de Leads desde Landing
**POST** `/landing/leads`

Para capturar leads desde formularios de contacto:
```typescript
interface CreateLeadDto {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  interestedPlan?: string;
  message?: string;
  source: 'landing_contact' | 'pricing_inquiry' | 'demo_request';
}
```

### 4. Newsletter Subscription
**POST** `/landing/newsletter`

Para suscripciones al newsletter:
```typescript
interface NewsletterSubscriptionDto {
  email: string;
  source?: string;        // Origen de la suscripción
}
```

### 5. Estadísticas Públicas del Landing
**GET** `/landing/stats`

Métricas públicas para mostrar en landing (social proof):
```typescript
interface LandingStats {
  totalUsers: number;
  totalAppointments: number;
  totalRevenue: number;    // Facturación procesada (formato público)
  averageGrowth: number;   // Crecimiento promedio de ingresos
}
```

## Admin Endpoints para Gestión de Planes

### 6. Gestión Completa de Planes (Admin)
**GET** `/admin/subscription-plans` - Listar todos los planes
**POST** `/admin/subscription-plans` - Crear nuevo plan
**PUT** `/admin/subscription-plans/{id}` - Actualizar plan
**DELETE** `/admin/subscription-plans/{id}` - Eliminar plan

```typescript
interface CreateSubscriptionPlanDto {
  slug: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  maxClients: number;
  maxInvoices: number;
  highlighted?: boolean;
  popular?: boolean;
  isActive?: boolean;
}
```

## Configuración de Entorno
- Landing debe usar `environment.landingApiUrl` para conectar con backend
- Implementar feature flag `environment.enableMockData` para desarrollo
- CORS configurado para dominio del landing page

## Estado de Implementación

**❌ PENDIENTE BACKEND**: 
- Modelo de datos para planes de suscripción
- Endpoints públicos del landing no implementados
- Sistema de gestión de leads no disponible

**✅ FRONTEND LISTO**: 
- Service layer implementado (`OrbitLandingApiService`)
- Componentes preparados para consumir API
- Estados de loading y error handling
- Fallback a datos mock funcional

**Next Steps**:
1. ❌ Implementar modelo `SubscriptionPlan` en base de datos
2. ❌ Crear controlador `/landing/*` endpoints
3. ❌ Implementar controlador `/admin/subscription-plans`
4. ❌ Configurar CORS y ambiente para landing
5. ❌ Actualizar documentación OpenAPI/Swagger
6. 🔄 Frontend: Cambiar `environment.enableMockData = false`