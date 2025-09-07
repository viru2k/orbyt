# Plan de Tareas: Generadores de Servicios Backend para ORBYT

## 🎯 Objetivo
Crear y configurar generadores automáticos de servicios de frontend para ambos servicios backend de ORBYT, siguiendo el patrón existente del proyecto.

---

## 📊 Estado Actual del Proyecto

### ✅ Ya Implementado - backoffice-hub (Puerto 3000)
- **Generador existente**: `ng-openapi-gen` configurado en `/orbyt/ng-openapi-gen.json`
- **Configuración actual**:
  ```json
  {
    "input": "http://localhost:3000/api-json",
    "output": "src/app/api",
    "angularVersion": "18"
  }
  ```
- **Script de generación**: `npm run openapi:generate` 
- **Servicios generados**: En `/orbyt/src/app/api/` (148+ archivos generados)
- **Estado**: ✅ **FUNCIONANDO** - Genera automáticamente servicios TypeScript desde OpenAPI

### ❌ Por Implementar - orbyt-landing-service (Puerto 3001)
- **Estado actual**: No hay generador configurado para el servicio de landing
- **Problema**: El frontend landing consume APIs de `localhost:3001` pero no tiene servicios generados automáticamente
- **Implementación manual**: Existe `orbyt-landing-api.service.ts` creado manualmente
- **Necesidad**: Configurar generador automático similar al de backoffice-hub

---

## 🚀 Plan de Tareas

### **Fase 1: Verificar Estado de orbyt-landing-service**

#### Tarea 1.1: Verificar si orbyt-landing-service está ejecutándose
- [ ] Probar conexión a `http://localhost:3001/health`
- [ ] Verificar endpoint OpenAPI en `http://localhost:3001/api-json`
- [ ] Documentar APIs disponibles en el servicio

#### Tarea 1.2: Analizar APIs existentes en orbyt-landing-api.service.ts
- [ ] Revisar endpoints implementados manualmente
- [ ] Verificar consistencia con especificaciones en `ORBYT_LANDING_BACKEND_SPECS.md`
- [ ] Identificar APIs faltantes o inconsistencias

### **Fase 2: Crear Generador para orbyt-landing-service**

#### Tarea 2.1: Configurar ng-openapi-gen para landing-service
- [ ] Crear `orbyt-landing/ng-openapi-gen.json` específico para puerto 3001
- [ ] Configurar output en `orbyt-landing/src/app/api-generated/`
- [ ] Añadir script de generación en `package.json`

#### Tarea 2.2: Estructura de archivos propuesta
```
orbyt-landing/
├── ng-openapi-gen.json          # Config para puerto 3001
├── src/app/
│   ├── api-generated/           # Servicios auto-generados
│   │   ├── api/                 # Servicios generados
│   │   ├── models/              # Interfaces generadas  
│   │   └── services/            # Servicios específicos
│   └── services/
│       └── orbyt-landing-api.service.ts  # Servicio manual (mantener como wrapper)
└── scripts/
    └── generate-api.sh          # Script de generación
```

#### Tarea 2.3: Actualizar configuración de build
- [ ] Añadir comando `npm run generate:landing-api`
- [ ] Integrar generación en proceso de build de landing
- [ ] Configurar pre-build hooks si es necesario

### **Fase 3: Implementar Doble Generador (Opcional)**

#### Tarea 3.1: Crear configuración unificada
- [ ] Script que genere servicios para ambos backends
- [ ] Comando `npm run generate:all-apis` 
- [ ] Separar outputs para evitar colisiones

#### Tarea 3.2: Estructura multi-backend propuesta
```
orbyt/
├── config/
│   ├── backoffice-api.json      # Config backoffice-hub:3000
│   └── landing-api.json         # Config landing-service:3001
├── orbyt/src/app/api/           # APIs backoffice (existente)
└── orbyt-landing/src/app/api/   # APIs landing (nuevo)
```

---

## 🛠️ Implementación Detallada

### **Configuración para orbyt-landing-service**

#### 1. `orbyt-landing/ng-openapi-gen.json`
```json
{
  "$schema": "../node_modules/ng-openapi-gen/ng-openapi-gen-schema.json",
  "input": "http://localhost:3001/api-json",
  "output": "src/app/api",
  "angularVersion": "19",
  "prefix": "Landing",
  "tag": "landing",
  "removeStaleFiles": true,
  "skipJsonSuffix": true
}
```

#### 2. Scripts en `package.json`
```json
{
  "scripts": {
    "generate:backoffice-api": "cd orbyt && npx ng-openapi-gen",
    "generate:landing-api": "cd orbyt-landing && npx ng-openapi-gen",
    "generate:all-apis": "npm run generate:backoffice-api && npm run generate:landing-api",
    "prebuild:landing": "npm run generate:landing-api"
  }
}
```

#### 3. Wrapper Service Pattern
```typescript
// orbyt-landing/src/app/services/landing-api.service.ts
@Injectable({ providedIn: 'root' })
export class LandingApiService {
  constructor(
    private authApi: LandingAuthService,      // Generated
    private plansApi: LandingPlansService,    // Generated
    private leadsApi: LandingLeadsService     // Generated
  ) {}

  // Métodos wrapper que combinan múltiples APIs generadas
  async registerWithPlan(data: RegisterDto): Promise<AuthResponse> {
    const authResult = await this.authApi.register(data).toPromise();
    // Lógica adicional...
    return authResult;
  }
}
```

---

## ⚠️ Consideraciones Importantes

### **Dependencias de Servicios Backend**
1. **backoffice-hub (3000)** debe estar ejecutándose para generar APIs de ORBYT
2. **orbyt-landing-service (3001)** debe estar ejecutándose para generar APIs de Landing
3. Ambos servicios deben exponer endpoint `/api-json` con esquema OpenAPI válido

### **Estrategia de Migración**
1. **Mantener** `orbyt-landing-api.service.ts` como wrapper service
2. **Generar** servicios automáticos en paralelo
3. **Migrar gradualmente** de manual a generado
4. **Eliminar** código manual una vez validado el generado

### **Ventajas de la Implementación**
- ✅ **Consistencia**: APIs siempre sincronizadas con backend
- ✅ **Tipo-seguridad**: Interfaces TypeScript automáticas
- ✅ **Mantenibilidad**: Cambios de backend se reflejan automáticamente
- ✅ **DX**: Mejor experiencia de desarrollador con auto-completado

---

## 📋 Checklist de Validación

### **Pre-requisitos**
- [ ] backoffice-hub ejecutándose en puerto 3000
- [ ] orbyt-landing-service ejecutándose en puerto 3001  
- [ ] Ambos servicios exponiendo `/api-json`
- [ ] ng-openapi-gen instalado en dependencies

### **Implementación Landing Service**
- [ ] Configuración `ng-openapi-gen.json` para puerto 3001
- [ ] Script `generate:landing-api` funcional
- [ ] Servicios generados en `orbyt-landing/src/app/api/`
- [ ] Integración con servicio wrapper existente
- [ ] Build de orbyt-landing exitoso

### **Testing**
- [ ] APIs generadas importables sin errores
- [ ] Tipos TypeScript correctos
- [ ] Métodos de API funcionales contra localhost:3001
- [ ] Backward compatibility con código existente

### **Documentación**
- [ ] README actualizado con nuevos comandos
- [ ] Docs de desarrollo con setup de generadores
- [ ] Guía de migración de manual a generado

---

## 🎯 Próximos Pasos Inmediatos

1. **Verificar** si orbyt-landing-service está ejecutándose
2. **Probar** endpoint `/api-json` en puerto 3001
3. **Crear** configuración `ng-openapi-gen.json` para landing
4. **Ejecutar** generación inicial y validar output
5. **Integrar** servicios generados en código existente

---

**Estado actual**: En investigación - Pendiente verificar estado de orbyt-landing-service
**Próxima acción**: Verificar conectividad con ambos servicios backend