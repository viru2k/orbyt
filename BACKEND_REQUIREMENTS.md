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

### 4. Validaciones
- Verificar permisos `canManageAgenda` en todos los endpoints de configuración
- Asegurar que solo usuarios con permisos puedan modificar configuración de otros usuarios
- Mantener la lógica actual de holidays por profesional

## Endpoints Actuales (Validados)
- ✅ GET `/agenda/config?professionalId={id}` - Obtener configuración
- ✅ PATCH `/agenda/config?professionalId={id}` - Actualizar configuración
- ✅ GET `/agenda/holidays?professionalId={id}` - Obtener días festivos
- ✅ POST `/agenda/holiday` - Agregar día festivo
- ❌ DELETE `/agenda/holiday/{id}` - **FALTA IMPLEMENTAR** - Eliminar día festivo

## Inconsistencias en API (Para Corregir)
- `CreateHolidayDto` usa campo `reason` pero `HolidayResponseDto` usa campo `description`
- Debe unificarse a usar `description` en ambos DTOs

## Frontend Changes Needed
1. Crear componente de configuración con switches PrimeNG
2. Mover modal de días festivos a la nueva sección
3. Implementar gestión por usuario con selector de profesional