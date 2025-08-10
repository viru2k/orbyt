# Guía para el Agente de Frontend: Gestión de Usuarios y Permisos

Este documento describe los endpoints clave y el flujo de interacción con la API de Backoffice Hub para la gestión de usuarios y sus permisos. Está diseñado para guiar la construcción de la interfaz de usuario, detallando las funcionalidades feature a feature.

---

# Configuración de Turnos y Horarios para Calendario

## Endpoint Específico de Configuración de Agenda

La API ya cuenta con endpoints específicos para manejar la configuración de calendarios, separado del perfil del usuario.

### GET `/agenda/config` 
Obtiene la configuración de agenda del profesional actual o especificado.

**Query Parameters:**
- `professionalId` (opcional): ID del profesional (solo para administradores)

**Respuesta:**
```json
{
  "id": 1,
  "userId": 1,
  "slotDurationMinutes": 30,
  "workStart": "09:00",
  "workEnd": "18:00",
  "workingDays": [1, 2, 3, 4, 5, 6],
  "allowOverbooking": false,
  "allowBookingOnBlockedDays": false
}
```

### PATCH `/agenda/config`
Actualiza la configuración de agenda del profesional.

**Query Parameters:**
- `professionalId` (opcional): ID del profesional (solo para administradores)

**Request Body:**
```json
{
  "startTime": "08:00",
  "endTime": "16:00",
  "slotDuration": 15,
  "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "overbookingAllowed": true,
  "allowBookingOnBlockedDays": false
}
```

## Gestión Avanzada de Agenda - Nuevos Endpoints

### POST `/agenda/block-dates` ✅
Bloquea múltiples fechas de una vez (vacaciones, días libres, etc.)

**Query Parameters:**
- `professionalId` (opcional): ID del profesional (solo para administradores)

**Request Body:**
```json
{
  "dates": ["2025-12-24", "2025-12-25", "2025-12-26"],
  "reason": "Vacaciones de Navidad"
}
```

**Respuesta:**
```json
{
  "message": "3 fechas bloqueadas exitosamente",
  "blockedDates": 3
}
```

**Ejemplo JavaScript:**
```javascript
const blockMultipleDates = async (dates, reason, professionalId = null) => {
  const url = professionalId 
    ? `/agenda/block-dates?professionalId=${professionalId}`
    : '/agenda/block-dates';
    
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ dates, reason })
  });
  
  return response.json();
};

// Uso: bloquear vacaciones de navidad
await blockMultipleDates(
  ["2025-12-24", "2025-12-25", "2025-12-26"],
  "Vacaciones de Navidad"
);
```

### DELETE `/agenda/block-dates` ⚠️
Desbloquea fechas específicas

**Query Parameters:**
- `professionalId` (opcional): ID del profesional
- `dates` (requerido): Fechas separadas por coma (ej: "2025-12-25,2025-12-26")

**Respuesta:**
```json
{
  "message": "2 fechas desbloqueadas exitosamente",
  "unblockedDates": 2
}
```

**Nota:** ⚠️ Este endpoint tiene un problema de validación actualmente. Usar con precaución.

### POST `/agenda/day-override` ✅
Configura horario especial para un día específico (sobrescribe configuración general)

**Query Parameters:**
- `professionalId` (opcional): ID del profesional

**Request Body:**
```json
{
  "date": "2025-12-23",
  "startTime": "10:00",
  "endTime": "14:00",
  "slotDuration": 60,
  "blocked": false,
  "note": "Horario especial víspera navidad"
}
```

**Respuesta:**
```json
{
  "message": "Override de día configurado exitosamente",
  "override": {
    "id": 1,
    "date": "2025-12-23",
    "startTime": "10:00",
    "endTime": "14:00",
    "slotDuration": 60,
    "blocked": false,
    "note": "Horario especial víspera navidad"
  }
}
```

**Ejemplo JavaScript:**
```javascript
const createDayOverride = async (config, professionalId = null) => {
  const url = professionalId 
    ? `/agenda/day-override?professionalId=${professionalId}`
    : '/agenda/day-override';
    
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  });
  
  return response.json();
};

// Uso: horario especial para víspera de navidad
await createDayOverride({
  date: "2025-12-23",
  startTime: "10:00",
  endTime: "14:00",
  slotDuration: 60,
  note: "Horario especial víspera navidad"
});
```

### GET `/agenda/day-overrides` ✅
Lista todos los overrides de días específicos

**Query Parameters:**
- `professionalId` (opcional): ID del profesional
- `from` (opcional): Fecha inicio filtro (YYYY-MM-DD)
- `to` (opcional): Fecha fin filtro (YYYY-MM-DD)

**Respuesta:**
```json
[
  {
    "id": 1,
    "date": "2025-12-23",
    "startTime": "10:00:00",
    "endTime": "14:00:00", 
    "slotDuration": 60,
    "blocked": false,
    "note": "Horario especial víspera navidad"
  }
]
```

**Ejemplo JavaScript:**
```javascript
const getDayOverrides = async (from = null, to = null, professionalId = null) => {
  let url = professionalId 
    ? `/agenda/day-overrides?professionalId=${professionalId}`
    : '/agenda/day-overrides';
    
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  if (params.toString()) url += `&${params}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
};
```

### PATCH `/agenda/bulk-config` ⚠️
Actualización masiva de configuración para un rango de fechas

**Query Parameters:**
- `professionalId` (opcional): ID del profesional

**Request Body:**
```json
{
  "dateRange": ["2025-01-01", "2025-01-07"],
  "workingDays": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "startTime": "08:00",
  "endTime": "17:00",
  "slotDuration": 30
}
```

**Respuesta:**
```json
{
  "message": "Configuración aplicada a 5 días",
  "affectedDays": 5
}
```

**Nota:** ⚠️ Este endpoint tiene un problema de validación actualmente.

### GET `/agenda/availability-range` ✅
Obtiene disponibilidad detallada para un rango de fechas

**Query Parameters:**
- `professionalId` (opcional): ID del profesional
- `from` (requerido): Fecha inicio (YYYY-MM-DD)
- `to` (requerido): Fecha fin (YYYY-MM-DD)

**Respuesta:**
```json
{
  "from": "2025-12-20",
  "to": "2025-12-27",
  "totalDays": 8,
  "workingDays": 6,
  "blockedDays": 0,
  "days": [
    {
      "date": "2025-12-20",
      "isWorkingDay": true,
      "isHoliday": false,
      "isBlocked": false,
      "override": null,
      "slots": [
        {
          "time": "09:00",
          "start": "2025-12-20T08:00:00.000Z",
          "end": "2025-12-20T08:45:00.000Z",
          "available": true
        }
      ],
      "availableSlots": 12,
      "totalSlots": 12
    }
  ]
}
```

**Ejemplo JavaScript:**
```javascript
const getAvailabilityRange = async (from, to, professionalId = null) => {
  let url = `/agenda/availability-range?from=${from}&to=${to}`;
  if (professionalId) url += `&professionalId=${professionalId}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.json();
};

// Uso: obtener disponibilidad para semana de navidad
const availability = await getAvailabilityRange("2025-12-20", "2025-12-27");

// Analizar disponibilidad
availability.days.forEach(day => {
  console.log(`${day.date}: ${day.availableSlots}/${day.totalSlots} slots disponibles`);
  
  if (day.isHoliday) console.log(`  - Feriado: ${day.holidayReason}`);
  if (day.override) console.log(`  - Horario especial: ${day.override.note}`);
  if (!day.isWorkingDay) console.log(`  - No es día laborable`);
});
```

## Implementación en el Calendario Frontend

### 1. Obtener Configuración de Calendario
```javascript
// Obtener configuración del usuario actual
const getCalendarConfig = async () => {
  const response = await fetch('/agenda/config', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Para administradores: obtener config de otro profesional
const getProfessionalConfig = async (professionalId) => {
  const response = await fetch(`/agenda/config?professionalId=${professionalId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### 2. Bloqueo de Días No Laborables
```javascript
// workingDays viene como array de números [1,2,3,4,5,6] donde 1=Lunes, 7=Domingo
const isWorkingDay = (date, config) => {
  const dayOfWeek = date.getDay(); // 0=Domingo, 1=Lunes...
  const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convertir 0=Domingo a 7
  return config.workingDays.includes(adjustedDay);
};
```

### 3. Configuración de Intervalos de Tiempo
```javascript
// Generar slots disponibles basados en slotDurationMinutes
const generateTimeSlots = (workStart, workEnd, slotDurationMinutes) => {
  const slots = [];
  let current = parseTime(workStart);
  const end = parseTime(workEnd);
  
  while (current < end) {
    slots.push(formatTime(current));
    current.setMinutes(current.getMinutes() + slotDurationMinutes);
  }
  
  return slots;
};

// Ejemplo de uso:
const config = await getCalendarConfig();
const availableSlots = generateTimeSlots(
  config.workStart,            // "09:00"
  config.workEnd,              // "18:00" 
  config.slotDurationMinutes   // 30 minutos
);
// Resultado: ["09:00", "09:30", "10:00", "10:30", ...]
```

### 4. Configuración del Selector de Tiempo
```javascript
// Configurar el step del input time basado en slotDurationMinutes
const timeInput = document.querySelector('input[type="time"]');
timeInput.step = config.slotDurationMinutes * 60; // convertir a segundos

// O para componentes personalizados:
const stepMinutes = config.slotDurationMinutes; // 5, 10, 15, 20, 30, 45, etc.
```

### 5. Gestión de Sobrereservas
```javascript
// Verificar si se permiten sobrereservas
const canOverbook = config.allowOverbooking;

// Mostrar warning o permitir reservas múltiples en el mismo slot
if (canOverbook) {
  // Mostrar opción para múltiples citas en el mismo horario
  showOverbookingOption();
}
```

### 6. Días Bloqueados
```javascript
// Verificar si se pueden hacer reservas en días bloqueados
const canBookOnBlockedDays = config.allowBookingOnBlockedDays;

// Usar el endpoint de feriados para días específicamente bloqueados
const getHolidays = async (professionalId = null) => {
  const url = professionalId 
    ? `/agenda/holidays?professionalId=${professionalId}`
    : '/agenda/holidays';
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Verificar si una fecha específica está bloqueada
const isBlockedDay = async (date, config) => {
  const holidays = await getHolidays();
  const dateStr = date.toISOString().split('T')[0];
  return holidays.some(holiday => holiday.date === dateStr);
};

const canBookOnThisDay = async (date, config) => {
  const isWorking = isWorkingDay(date, config);
  const isBlocked = await isBlockedDay(date, config);
  
  return isWorking && (!isBlocked || config.allowBookingOnBlockedDays);
};
```

### 7. Actualizar Configuración
```javascript
const updateCalendarConfig = async (configData, professionalId = null) => {
  const url = professionalId 
    ? `/agenda/config?professionalId=${professionalId}`
    : '/agenda/config';
    
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      startTime: configData.startTime,
      endTime: configData.endTime,
      slotDuration: configData.slotDuration, // 5-60 minutos
      workingDays: configData.workingDays,   // ["monday", "tuesday", ...]
      overbookingAllowed: configData.overbookingAllowed,
      allowBookingOnBlockedDays: configData.allowBookingOnBlockedDays
    })
  });
  
  return response.json();
};
```

## Estructura de Datos para el Frontend

### Configuración de Calendario (Respuesta GET)
```typescript
interface AgendaConfigResponse {
  id: number;
  userId: number;
  slotDurationMinutes: number;    // 30 (minutos)
  workStart: string;              // "09:00"
  workEnd: string;                // "18:00"
  workingDays: number[];          // [1,2,3,4,5,6] (1=Lunes, 7=Domingo)
  allowOverbooking: boolean;
  allowBookingOnBlockedDays: boolean;
}
```

### Configuración de Calendario (Para actualizar PATCH)
```typescript
interface UpdateAgendaConfigDto {
  startTime: string;              // "08:00"
  endTime: string;                // "16:00"
  slotDuration: number;           // 5-60 minutos
  workingDays: string[];          // ["monday", "tuesday", "wednesday"]
  overbookingAllowed: boolean;
  allowBookingOnBlockedDays: boolean;
}
```

### Feriados/Días Bloqueados

#### Configuración de Agenda

La aplicación incluye una página dedicada de configuración de agenda en `/agenda/config` que permite:

1. **Gestión por Usuario**: Los administradores con permisos `canManageAgenda` pueden seleccionar un profesional para configurar su agenda
2. **Días de Trabajo**: Switches para habilitar/deshabilitar días específicos de la semana
3. **Configuración de Horarios**: 
   - Hora de inicio y fin de jornada laboral
   - Duración de slots en minutos (5, 10, 15, 20, 30, 45, 60)
   - Configuración de sobrereservas
4. **Gestión de Feriados**: Modal integrado para agregar/eliminar días bloqueados

#### Componentes Frontend Creados

- `AgendaConfigComponent`: Página principal de configuración
- `OrbSwitchComponent`: Componente reutilizable para switches PrimeNG
- `OrbInputNumberComponent`: Componente para configurar duración de slots
- `HolidaysModalComponent`: Modal actualizado para gestión de feriados

#### DTOs e Interfaces

```typescript
interface HolidayResponseDto {
  id: number;
  userId: number;
  date: string;                   // "2024-12-25" (YYYY-MM-DD)
  description?: string;           // "Navidad" (opcional)
}

interface CreateHolidayDto {
  date: string;                   // "2024-12-25" (YYYY-MM-DD)
  reason?: string;                // "Navidad" (opcional)
}
```

**⚠️ Inconsistencia de API**: `CreateHolidayDto` usa el campo `reason` pero `HolidayResponseDto` usa `description`. Esta inconsistencia requiere corrección en el backend para unificar el campo como `description`.

#### Endpoints Relacionados

- ✅ `GET /agenda/holidays?professionalId={id}` - Obtener días festivos
- ✅ `POST /agenda/holiday` - Agregar día festivo
- ❌ `DELETE /agenda/holiday/{id}` - **FALTA IMPLEMENTAR** - Eliminar día festivo

#### Permisos Requeridos

- `canManageAgenda`: Para acceder a la configuración y modificar agenda de otros usuarios

## Casos de Uso Comunes

### Configuraciones Típicas por Profesional
```javascript
// Estilista - turnos largos, no trabaja lunes
const estilistaConfig = {
  startTime: "09:00",
  endTime: "18:00",
  slotDuration: 45,
  workingDays: ["tuesday", "wednesday", "thursday", "friday", "saturday"],
  overbookingAllowed: false,
  allowBookingOnBlockedDays: false
};

// Médico - turnos cortos, días específicos
const medicoConfig = {
  startTime: "08:00",
  endTime: "16:00", 
  slotDuration: 20,
  workingDays: ["monday", "wednesday", "friday"],
  overbookingAllowed: true,  // Permite emergencias
  allowBookingOnBlockedDays: false
};

// Consultor - turnos de hora, horarios flexibles
const consultorConfig = {
  startTime: "10:00",
  endTime: "19:00",
  slotDuration: 60,
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  overbookingAllowed: false,
  allowBookingOnBlockedDays: true
};
```

### Validaciones Frontend
```javascript
const validateAppointment = async (date, time, config) => {
  // 1. Verificar día laborable
  if (!isWorkingDay(date, config)) {
    return { valid: false, error: "Día no laborable" };
  }
  
  // 2. Verificar horario de trabajo
  if (time < config.workStart || time > config.workEnd) {
    return { valid: false, error: "Fuera del horario laboral" };
  }
  
  // 3. Verificar que el horario esté alineado con slotDurationMinutes
  if (!isValidTimeSlot(time, config.slotDurationMinutes)) {
    return { valid: false, error: "Horario no disponible" };
  }
  
  // 4. Verificar días bloqueados (feriados)
  const isBlocked = await isBlockedDay(date, config);
  if (isBlocked && !config.allowBookingOnBlockedDays) {
    return { valid: false, error: "Día bloqueado" };
  }
  
  return { valid: true };
};

// Función auxiliar para validar slots válidos
const isValidTimeSlot = (timeString, slotDurationMinutes) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes % slotDurationMinutes === 0;
};
```

## Flujo Completo de Implementación

### 1. Inicialización del Calendario con Gestión Avanzada
```javascript
const initializeCalendar = async () => {
  try {
    // Obtener configuración básica
    const config = await getCalendarConfig();
    
    // Configurar días habilitados
    calendar.setWorkingDays(config.workingDays);
    
    // Configurar horarios
    calendar.setWorkingHours(config.workStart, config.workEnd);
    
    // Configurar intervalos de tiempo
    calendar.setTimeSlots(config.slotDurationMinutes);
    
    // Obtener y marcar feriados
    const holidays = await getHolidays();
    calendar.setBlockedDates(holidays.map(h => h.date));
    
    // Obtener y aplicar overrides de días específicos
    const dayOverrides = await getDayOverrides();
    calendar.setDayOverrides(dayOverrides);
    
    return config;
  } catch (error) {
    console.error('Error inicializando calendario:', error);
  }
};
```

### 2. Panel de Gestión Avanzada de Agenda
```javascript
// Componente principal para gestión avanzada
const AgendaManagementPanel = () => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [availabilityData, setAvailabilityData] = useState(null);

  // Bloquear múltiples fechas seleccionadas
  const handleBulkBlock = async () => {
    try {
      const result = await blockMultipleDates(
        selectedDates,
        "Fechas bloqueadas desde panel de gestión"
      );
      showNotification(`${result.blockedDates} fechas bloqueadas exitosamente`);
      // Actualizar calendario
      await refreshCalendar();
    } catch (error) {
      showError('Error bloqueando fechas');
    }
  };

  // Obtener análisis de disponibilidad
  const handleAnalyzeAvailability = async () => {
    const from = document.getElementById('date-from').value;
    const to = document.getElementById('date-to').value;
    
    const data = await getAvailabilityRange(from, to);
    setAvailabilityData(data);
    
    // Mostrar estadísticas
    showAvailabilityStats(data);
  };

  // Configurar horario especial para un día
  const handleCreateDayOverride = async (date, config) => {
    try {
      const result = await createDayOverride({
        date,
        ...config
      });
      showNotification('Horario especial configurado');
      await refreshCalendar();
    } catch (error) {
      showError('Error configurando horario especial');
    }
  };

  return (
    <div className="agenda-management-panel">
      {/* Interfaz para selección múltiple de fechas */}
      <DateSelector 
        onDatesSelected={setSelectedDates}
        multiSelect={true}
      />
      
      {/* Panel de análisis de disponibilidad */}
      <AvailabilityAnalyzer 
        onAnalyze={handleAnalyzeAvailability}
        data={availabilityData}
      />
      
      {/* Panel de configuración de días especiales */}
      <DayOverridePanel 
        onCreateOverride={handleCreateDayOverride}
      />
    </div>
  );
};
```

### 3. Componente de Análisis de Disponibilidad
```javascript
const AvailabilityAnalyzer = ({ onAnalyze, data }) => {
  const renderDayAnalysis = (day) => (
    <div key={day.date} className={`day-analysis ${getDayStatusClass(day)}`}>
      <h4>{day.date}</h4>
      <div className="day-stats">
        <span>Slots: {day.availableSlots}/{day.totalSlots}</span>
        {day.isHoliday && <span className="holiday">Feriado: {day.holidayReason}</span>}
        {day.override && <span className="override">Horario especial: {day.override.note}</span>}
        {!day.isWorkingDay && <span className="non-working">No laborable</span>}
      </div>
      
      {/* Mostrar slots disponibles */}
      <div className="slots-grid">
        {day.slots?.slice(0, 6).map(slot => (
          <div 
            key={slot.time} 
            className={`slot ${slot.available ? 'available' : 'occupied'}`}
          >
            {slot.time}
          </div>
        ))}
        {day.slots?.length > 6 && <span>+{day.slots.length - 6} más</span>}
      </div>
    </div>
  );

  const getDayStatusClass = (day) => {
    if (day.isHoliday || day.isBlocked) return 'blocked';
    if (!day.isWorkingDay) return 'non-working';
    if (day.availableSlots === 0) return 'full';
    if (day.availableSlots < day.totalSlots / 2) return 'busy';
    return 'available';
  };

  return (
    <div className="availability-analyzer">
      <div className="date-range-selector">
        <input type="date" id="date-from" />
        <input type="date" id="date-to" />
        <button onClick={onAnalyze}>Analizar Disponibilidad</button>
      </div>
      
      {data && (
        <div className="availability-results">
          <div className="summary-stats">
            <div className="stat">
              <span className="label">Total días:</span>
              <span className="value">{data.totalDays}</span>
            </div>
            <div className="stat">
              <span className="label">Días laborables:</span>
              <span className="value">{data.workingDays}</span>
            </div>
            <div className="stat">
              <span className="label">Días bloqueados:</span>
              <span className="value">{data.blockedDays}</span>
            </div>
          </div>
          
          <div className="days-grid">
            {data.days.map(renderDayAnalysis)}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 4. Gestión de Horarios Especiales
```javascript
const DayOverridePanel = ({ onCreateOverride }) => {
  const [overrides, setOverrides] = useState([]);
  
  useEffect(() => {
    // Cargar overrides existentes
    loadDayOverrides();
  }, []);

  const loadDayOverrides = async () => {
    try {
      const data = await getDayOverrides();
      setOverrides(data);
    } catch (error) {
      console.error('Error cargando overrides:', error);
    }
  };

  const handleCreateSpecialDay = async (formData) => {
    try {
      await onCreateOverride(formData.date, {
        startTime: formData.startTime,
        endTime: formData.endTime,
        slotDuration: formData.slotDuration,
        blocked: formData.blocked,
        note: formData.note
      });
      
      await loadDayOverrides(); // Recargar lista
    } catch (error) {
      showError('Error creando horario especial');
    }
  };

  return (
    <div className="day-override-panel">
      <h3>Horarios Especiales</h3>
      
      {/* Formulario para nuevo override */}
      <OverrideForm onSubmit={handleCreateSpecialDay} />
      
      {/* Lista de overrides existentes */}
      <div className="overrides-list">
        {overrides.map(override => (
          <div key={override.id} className="override-item">
            <div className="override-date">{override.date}</div>
            <div className="override-time">
              {override.blocked ? (
                <span className="blocked">Día bloqueado</span>
              ) : (
                <span>{override.startTime} - {override.endTime}</span>
              )}
            </div>
            <div className="override-note">{override.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Formulario para crear override
const OverrideForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '09:00',
    endTime: '18:00',
    slotDuration: 30,
    blocked: false,
    note: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ ...formData, date: '', note: '' }); // Reset form
  };

  return (
    <form onSubmit={handleSubmit} className="override-form">
      <input 
        type="date" 
        value={formData.date}
        onChange={(e) => setFormData({...formData, date: e.target.value})}
        required 
      />
      
      <label>
        <input 
          type="checkbox"
          checked={formData.blocked}
          onChange={(e) => setFormData({...formData, blocked: e.target.checked})}
        />
        Bloquear día completo
      </label>
      
      {!formData.blocked && (
        <>
          <input 
            type="time" 
            value={formData.startTime}
            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
          />
          <input 
            type="time" 
            value={formData.endTime}
            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
          />
          <input 
            type="number" 
            min="5" 
            max="120" 
            value={formData.slotDuration}
            onChange={(e) => setFormData({...formData, slotDuration: parseInt(e.target.value)})}
          />
        </>
      )}
      
      <input 
        type="text" 
        placeholder="Nota (ej: Horario especial víspera)"
        value={formData.note}
        onChange={(e) => setFormData({...formData, note: e.target.value})}
      />
      
      <button type="submit">Crear Horario Especial</button>
    </form>
  );
};
```

### 2. Agregar Feriados
```javascript
const addHoliday = async (date, description, professionalId = null) => {
  const url = professionalId 
    ? `/agenda/holiday?professionalId=${professionalId}`
    : '/agenda/holiday';
    
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      date: date,        // "2024-12-25"
      reason: description // "Navidad"
    })
  });
  
  return response.json();
};
```

## Notas de Implementación

### Configuración Básica
1. **Días de la Semana**: 
   - **Respuesta GET**: array de números `[1,2,3,4,5,6]` donde 1=Lunes, 7=Domingo
   - **Request PATCH**: array de strings `["monday", "tuesday", "wednesday"]`

2. **Formato de Tiempo**: Usar formato 24h "HH:MM" 

3. **Duración de Slots**: Entre 5-60 minutos (validado por el backend)

4. **Permisos**: 
   - `agenda:read:own` / `agenda:read:group` para ver configuraciones
   - `agenda:write:own` / `agenda:write:group` para modificar

5. **Administradores**: Pueden especificar `professionalId` para gestionar otros usuarios

6. **Feriados**: Sistema completo para bloquear días específicos por profesional

### Gestión Avanzada
7. **Estados de Endpoints**: 
   - ✅ **Funcionando correctamente**: `POST /block-dates`, `POST /day-override`, `GET /day-overrides`, `GET /availability-range`
   - ⚠️ **Con problemas de validación**: `DELETE /block-dates`, `PATCH /bulk-config`

8. **Jerarquía de Configuración**:
   - Configuración base (`/agenda/config`) → Feriados (`/holidays`) → Overrides de días (`/day-overrides`)
   - Los overrides tienen prioridad sobre la configuración base
   - Los días bloqueados (holidays) anulan todo lo demás

9. **Flujo de Datos Recomendado**:
   ```javascript
   // 1. Cargar configuración base
   const config = await getCalendarConfig();
   
   // 2. Cargar feriados/días bloqueados
   const holidays = await getHolidays();
   
   // 3. Cargar overrides de días específicos
   const overrides = await getDayOverrides();
   
   // 4. Para análisis completo, usar availability-range
   const availability = await getAvailabilityRange(from, to);
   ```

10. **Manejo de Errores**:
    ```javascript
    try {
      const result = await blockMultipleDates(dates, reason);
    } catch (error) {
      if (error.status === 400) {
        // Problemas de validación - revisar formato de datos
      } else if (error.status === 403) {
        // Sin permisos - mostrar mensaje apropiado
      } else if (error.status === 404) {
        // Usuario sin configuración de agenda
      }
    }
    ```

11. **Optimización de Performance**:
    - Usar `availability-range` para análisis de períodos largos
    - Cachear configuración base y actualizar solo cuando sea necesario
    - Usar overrides para excepciones, no como regla general

---

## 1. Autenticación

Antes de interactuar con cualquier endpoint protegido, el agente de frontend debe autenticarse para obtener un JSON Web Token (JWT).

*   **Endpoint**: `POST /auth/login`
*   **Cuerpo de la Solicitud (Request Body)**:
    ```json
    {
      "email": "usuario@ejemplo.com",
      "password": "su_password"
    }
    ```
*   **Respuesta Exitosa (200 OK)**:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```
*   **Uso**: El `accessToken` debe ser almacenado de forma segura (ej. `localStorage` o `sessionStorage`) y enviado en el encabezado `Authorization` como `Bearer <accessToken>` en todas las solicitudes subsiguientes a endpoints protegidos.

---

## 2. Gestión de Usuarios y Permisos

### 2.1. Listado de Usuarios del Grupo (con Roles y Permisos)

Este endpoint permite a un administrador obtener una lista de todos los usuarios que pertenecen a su mismo grupo (tenant), incluyendo sus roles y los permisos asociados a cada rol.

*   **Endpoint**: `GET /users/group`
*   **Permiso Requerido**: `user:manage:group` (El usuario autenticado debe tener este permiso).
*   **Respuesta Exitosa (200 OK)**: Array de `UserResponseDto`.
    ```json
    [
      {
        "id": 1,
        "email": "admin@glamour.com",
        "fullName": "Admin Glamour",
        "isAdmin": true,
        "active": true,
        "createdAt": "2025-08-06T10:00:00.000Z",
        "updatedAt": "2025-08-06T10:00:00.000Z",
        "roles": [
          {
            "id": 1,
            "name": "Admin de Cuenta",
            "description": "Acceso total a la cuenta.",
            "permissions": [
              { "id": 1, "name": "agenda:read:own", "description": "Ver la agenda propia" },
              { "id": 2, "name": "agenda:read:group", "description": "Ver la agenda de todos en el grupo" },
              // ... más permisos
            ]
          }
        ]
      },
      {
        "id": 2,
        "email": "estilista@glamour.com",
        "fullName": "Carlos Estilista",
        "isAdmin": false,
        "active": true,
        "createdAt": "2025-08-06T10:05:00.000Z",
        "updatedAt": "2025-08-06T10:05:00.000Z",
        "roles": [
          {
            "id": 2,
            "name": "Profesional",
            "description": "Gestiona su agenda y clientes.",
            "permissions": [
              { "id": 1, "name": "agenda:read:own", "description": "Ver la agenda propia" },
              // ... más permisos
            ]
          }
        ]
      }
    ]
    ```
*   **Uso en Frontend**: Utilizar esta respuesta para poblar una tabla o lista de usuarios, mostrando su información básica, y permitiendo expandir para ver los roles y permisos detallados.

### 2.2. Actualización de Roles de Sub-Usuarios

Permite a un administrador actualizar el perfil de un sub-usuario, incluyendo su nombre, estado de actividad y, crucialmente, los roles asignados.

*   **Endpoint**: `PATCH /users/sub-user/:id`
*   **Permiso Requerido**: `user:manage:group`
*   **Parámetros de Ruta**: `:id` (ID del sub-usuario a actualizar).
*   **Cuerpo de la Solicitud (Request Body)**: `AdminUpdateUserDto`.
    *   **Ejemplo 1: Actualizar roles y estado de actividad**
        ```json
        {
          "isActive": true,
          "roles": [
            { "id": 1, "name": "Admin de Cuenta" },
            { "id": 2, "name": "Profesional" }
          ]
        }
        ```
    *   **Ejemplo 2: Actualizar solo el nombre completo**
        ```json
        {
          "fullName": "Nuevo Nombre Completo del Usuario"
        }
        ```
*   **Consideraciones**:
    *   El backend solo utilizará el `id` de los objetos `roles` para vincular los roles existentes al usuario. El `name` es opcional en el envío, pero se recomienda incluirlo para claridad en el frontend.
    *   Solo se pueden actualizar usuarios que pertenezcan al mismo grupo del administrador autenticado y que no sean administradores de cuenta (el propio `owner`).

### 2.3. Obtención de Permisos Disponibles

Este endpoint proporciona una lista de todos los permisos atómicos definidos en el sistema. Es útil para construir interfaces de administración de roles donde se puedan seleccionar permisos.

*   **Endpoint**: `GET /permissions`
*   **Permiso Requerido**: `role:manage`
*   **Respuesta Exitosa (200 OK)**: Array de `PermissionResponseDto`.
    ```json
    [
      {
        "id": 1,
        "name": "agenda:read:own",
        "description": "Ver la agenda propia"
      },
      {
        "id": 2,
        "name": "agenda:read:group",
        "description": "Ver la agenda de todos en el grupo"
      },
      {
        "id": 7,
        "name": "user:manage:group",
        "description": "Crear/editar/eliminar sub-usuarios del grupo"
      }
      // ... y así sucesivamente para todos los permisos
    ]
    ```
*   **Uso en Frontend**: Esta lista puede ser utilizada para poblar selectores o checkboxes en una interfaz de gestión de roles (si se implementa la creación/edición de roles en el frontend), permitiendo al administrador asignar permisos a un rol.

---

## 3. Plan de Implementación (Feature a Feature)

Este plan sugiere un orden lógico para construir las funcionalidades en el frontend.

### Feature 1: Módulo de Autenticación (Login)

*   **Descripción**: Interfaz de usuario para que los usuarios ingresen sus credenciales (email y contraseña).
*   **Interacción API**:
    *   Realizar una solicitud `POST` a `/auth/login` con el email y la contraseña.
    *   En caso de éxito (200 OK), extraer el `accessToken` de la respuesta.
    *   Almacenar el `accessToken` de forma segura (ej. `localStorage`).
    *   Redirigir al usuario a la página principal o al dashboard.
    *   Manejar errores (ej. credenciales inválidas, usuario inactivo) mostrando mensajes apropiados.

### Feature 2: Visualización de Usuarios del Grupo

*   **Descripción**: Una página o componente que muestre una lista de todos los usuarios bajo la cuenta del administrador autenticado.
*   **Interacción API**:
    *   Al cargar la página/componente, realizar una solicitud `GET` a `/users/group`, incluyendo el JWT en el encabezado `Authorization`.
    *   Procesar la respuesta (array de `UserResponseDto`).
    *   Renderizar una tabla o lista, mostrando el `email`, `fullName`, `isAdmin`, `active` de cada usuario.
    *   Implementar una forma de expandir cada fila para mostrar los `roles` asignados al usuario, y dentro de cada rol, sus `permissions`.
    *   Manejar estados de carga y errores de la API.

### Feature 3: Edición de Roles de Sub-Usuario

*   **Descripción**: Un formulario o modal que permita a un administrador modificar los detalles de un sub-usuario, incluyendo la asignación de roles.
*   **Interacción API**:
    *   **Carga de Datos**: Al abrir el formulario para un usuario específico, se pueden usar los datos ya obtenidos del `GET /users/group`.
    *   **Selección de Roles**:
        *   Para permitir la selección de roles, el frontend necesitará una lista de todos los roles disponibles. Por ahora, se puede asumir que el frontend tiene esta lista o la obtiene de los roles ya presentes en los usuarios del `GET /users/group`. (Idealmente, en el futuro, podría haber un `GET /roles` para obtener todos los roles disponibles).
        *   Presentar una interfaz (ej. checkboxes, multi-select) para que el administrador elija los roles que desea asignar al sub-usuario.
    *   **Envío de Actualización**:
        *   Al guardar los cambios, construir un objeto `AdminUpdateUserDto`.
        *   El array `roles` en el DTO debe contener objetos con al menos el `id` de cada rol seleccionado (ej. `{ id: 1, name: "Admin de Cuenta" }`).
        *   Realizar una solicitud `PATCH` a `/users/sub-user/:id` (reemplazando `:id` con el ID real del usuario) con el `AdminUpdateUserDto` en el cuerpo.
        *   Manejar la respuesta (200 OK para éxito) y los errores (ej. 400 Bad Request, 403 Forbidden).

### Feature 4: Visualización de Permisos Disponibles (Opcional/Futuro)

*   **Descripción**: Una sección dedicada (quizás dentro de un módulo de "Gestión de Roles" más amplio) para listar y describir todos los permisos atómicos del sistema.
*   **Interacción API**:
    *   Realizar una solicitud `GET` a `/permissions`, incluyendo el JWT.
    *   Procesar la respuesta (array de `PermissionResponseDto`).
    *   Renderizar una lista o tabla mostrando el `name` y `description` de cada permiso.
*   **Uso**: Aunque no es directamente para la gestión de usuarios, esta funcionalidad es crucial para que un administrador entienda qué capacidades confiere cada permiso, lo cual es fundamental para la gestión de roles.

---
