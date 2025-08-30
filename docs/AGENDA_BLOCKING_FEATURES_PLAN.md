# Plan de Trabajo: Funcionalidades de Bloqueo y Gestión de Fechas de Agenda

## 📋 Resumen Ejecutivo

Se han identificado endpoints críticos para la gestión avanzada de fechas en la agenda que no están implementados en el frontend. Este documento presenta un plan completo para implementar estas funcionalidades de manera intuitiva y clara.

## 🔍 Análisis de Endpoints Disponibles

### ✅ Endpoints Identificados:

1. **Bloquear múltiples fechas** - `POST /agenda/block-dates`
   - DTO: `BlockDatesDto { dates: string[], reason?: string }`
   - Uso: Vacaciones, días libres, bloqueos masivos

2. **Desbloquear fechas específicas** - `DELETE /agenda/block-dates`
   - Parámetros: `dates: string` (fechas separadas por coma)
   - Uso: Reactivar fechas previamente bloqueadas

3. **Configurar horario especial** - `POST /agenda/day-override`
   - DTO: `DayOverrideDto { date: string, startTime?, endTime?, slotDuration?, blocked?, note? }`
   - Uso: Horarios especiales para días específicos

4. **Listar overrides de días** - `GET /agenda/day-overrides`
   - Parámetros: `from?, to?, professionalId?`
   - Uso: Ver configuraciones especiales en un rango

5. **Disponibilidad del calendario** - `GET /agenda/calendar-availability`
   - Parámetros: `year: number, month: number, professionalId?`
   - Uso: Vista mensual de disponibilidad

6. **Disponibilidad por rango** - `GET /agenda/availability-range`
   - Uso: Consultar disponibilidad en fechas específicas

## 🎨 Propuesta de Diseño UX

### Opción 1: Nueva Sección en Modal Existente ⭐ RECOMENDADA
Agregar una nueva card **"Gestión de Fechas Especiales"** al modal actual de configuración de agenda.

### Opción 2: Módulo Independiente
Crear un sistema separado accesible desde el menú principal de agenda.

### Opción 3: Integración en Vista de Calendario
Funcionalidades directamente integradas en la vista de calendario existente.

## 📋 Plan de Implementación Detallado

### FASE 1: Preparación y Estructura Base (2-3 días)

#### 1.1 Crear Servicios y Stores
```typescript
// services/agenda-blocking.service.ts
- blockMultipleDates()
- unblockDates()  
- createDayOverride()
- getDayOverrides()
- getCalendarAvailability()

// store/agenda-blocking.store.ts
- blockedDates$
- dayOverrides$
- calendarAvailability$
- loading states
```

#### 1.2 Crear Modelos y Tipos
```typescript
// models/agenda-blocking.models.ts
export interface BlockedDateItem {
  date: string;
  reason?: string;
  type: 'blocked' | 'override';
}

export interface DayOverride extends DayOverrideDto {
  id?: string;
  isCustomSchedule: boolean;
}
```

### FASE 2: Componentes Base (3-4 días)

#### 2.1 Componente de Selector de Fechas
```html
<!-- date-range-selector.component.html -->
<orb-card>
  <div orbHeader>Seleccionar Fechas</div>
  <div orbBody>
    <!-- Calendario múltiple + lista de fechas seleccionadas -->
  </div>
</orb-card>
```

#### 2.2 Componente de Gestión de Bloqueos
```html
<!-- blocking-management.component.html -->
<orb-card>
  <div orbHeader>Bloquear/Desbloquear Fechas</div>
  <div orbBody>
    <!-- Formulario + tabla de fechas bloqueadas -->
  </div>
</orb-card>
```

#### 2.3 Componente de Horarios Especiales  
```html
<!-- special-schedule.component.html -->
<orb-card>
  <div orbHeader>Horarios Especiales</div>
  <div orbBody>
    <!-- Formulario para configurar horarios específicos -->
  </div>
</orb-card>
```

### FASE 3: Integración en Modal de Configuración (2 días)

#### 3.1 Modificar Modal Existente
```html
<!-- Agregar nueva card después de "Días Laborales" -->
<orb-card>
  <div orbHeader>
    <h4><i class="pi pi-ban" style="color: #e74c3c;"></i> Gestión de Fechas Especiales</h4>
  </div>
  <div orbBody>
    <p-tabView>
      <p-tabPanel header="Bloquear Fechas">
        <app-blocking-management></app-blocking-management>
      </p-tabPanel>
      <p-tabPanel header="Horarios Especiales">  
        <app-special-schedule></app-special-schedule>
      </p-tabPanel>
      <p-tabPanel header="Vista Calendar">
        <app-calendar-overview></app-calendar-overview>
      </p-tabPanel>
    </p-tabView>
  </div>
</orb-card>
```

### FASE 4: Funcionalidades Avanzadas (3-4 días)

#### 4.1 Vista de Calendario con Disponibilidad
- Integrar calendario visual que muestre:
  - ✅ Días disponibles
  - ❌ Días bloqueados  
  - ⚡ Días con horarios especiales
  - 🎉 Días festivos

#### 4.2 Gestión Masiva de Fechas
- Importar/Exportar fechas bloqueadas
- Plantillas de bloqueo (ej: "Vacaciones de Verano")
- Bloqueo por patrones (todos los domingos, etc.)

#### 4.3 Integración con Vista Principal de Agenda
- Mostrar indicadores visuales en el calendario principal
- Tooltip con información de bloqueos/horarios especiales

### FASE 5: Testing y Refinamiento (2-3 días)

#### 5.1 Testing de Componentes
- Unit tests para servicios
- Integration tests para componentes
- E2E tests para flujos completos

#### 5.2 UX/UI Polish
- Validación de formularios
- Mensajes de error/éxito
- Loading states
- Responsive design

## 🗂️ Estructura de Archivos Propuesta

```
src/app/features/agenda/
├── components/
│   ├── agenda-config-modal/           # Existente - modificar
│   ├── blocking-management/           # Nuevo
│   │   ├── blocking-management.component.ts
│   │   ├── blocking-management.component.html  
│   │   └── blocking-management.component.scss
│   ├── special-schedule/              # Nuevo
│   │   ├── special-schedule.component.ts
│   │   ├── special-schedule.component.html
│   │   └── special-schedule.component.scss
│   ├── date-range-selector/           # Nuevo
│   │   └── ...
│   └── calendar-overview/             # Nuevo
│       └── ...
├── services/
│   └── agenda-blocking.service.ts     # Nuevo
├── models/
│   └── agenda-blocking.models.ts      # Nuevo  
└── store/
    └── agenda-blocking.store.ts       # Nuevo
```

## 🎯 Criterios de Éxito

### Funcionales:
- ✅ Bloquear/desbloquear fechas individuales y múltiples
- ✅ Configurar horarios especiales para días específicos  
- ✅ Vista calendar con disponibilidad visual
- ✅ Lista y gestión de todos los overrides
- ✅ Integración fluida con sistema existente

### UX/UI:
- ✅ Interfaz intuitiva y clara
- ✅ Feedback visual inmediato
- ✅ Validación de datos robusta
- ✅ Responsive en mobile/desktop
- ✅ Consistencia con design system

### Técnicos:
- ✅ Código mantenible y escalable
- ✅ Performance óptimo
- ✅ Error handling robusto
- ✅ Testing coverage > 80%

## 📊 Estimación Temporal

**Total: 12-16 días de desarrollo**

| Fase | Duración | Descripción |
|------|----------|-------------|
| Fase 1 | 2-3 días | Servicios, stores, modelos |
| Fase 2 | 3-4 días | Componentes base |
| Fase 3 | 2 días | Integración en modal |
| Fase 4 | 3-4 días | Funcionalidades avanzadas |
| Fase 5 | 2-3 días | Testing y refinamiento |

## 🔄 Plan de Continuación para Próximo Agente

### Para retomar el trabajo:

1. **Leer este documento completo** 
2. **Revisar endpoints disponibles** en `/src/app/api/fn/agenda/`
3. **Comenzar por Fase 1**: Crear servicios y stores
4. **Seguir estructura propuesta** en este documento
5. **Mantener consistencia** con modal actual usando `orb-card`
6. **Aplicar gap de 8px** entre todos los elementos como se estableció

### Archivos clave para consultar:
- `agenda-config-modal.component.*` - Modal existente
- `/api/fn/agenda/agenda-controller-*.ts` - Endpoints disponibles
- `/api/models/*-dto.ts` - Estructuras de datos

## 💡 Notas Importantes

1. **Mantener consistencia**: Usar `orb-card` con gap de 8px establecido
2. **UX intuitivo**: Las funciones de bloqueo deben ser obvias para el usuario
3. **Validación robusta**: Evitar conflictos entre fechas bloqueadas y citas existentes  
4. **Performance**: Lazy loading para vistas de calendario grandes
5. **Responsive**: Funcional en todas las resoluciones

---

**Última actualización:** ${new Date().toISOString().split('T')[0]}  
**Autor:** Claude Code Assistant  
**Estado:** Plan aprobado - Listo para implementación