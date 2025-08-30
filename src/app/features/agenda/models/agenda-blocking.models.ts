import { DayOverrideDto } from '../../../api/models/day-override-dto';

/**
 * Tipos de bloqueo disponibles
 */
export enum BlockingType {
  BLOCKED = 'blocked',           // Día completamente bloqueado
  CUSTOM_SCHEDULE = 'override',  // Día con horario personalizado
  HOLIDAY = 'holiday'            // Día festivo (desde el sistema existente)
}

/**
 * Estados de disponibilidad para el calendar
 */
export enum AvailabilityStatus {
  AVAILABLE = 'available',       // Disponible normalmente
  BLOCKED = 'blocked',          // Bloqueado completamente
  CUSTOM = 'custom',            // Horario personalizado
  HOLIDAY = 'holiday',          // Día festivo
  PARTIAL = 'partial'           // Parcialmente ocupado
}

/**
 * Información de una fecha bloqueada para mostrar en la UI
 */
export interface BlockedDateItem {
  /** Fecha en formato YYYY-MM-DD */
  date: string;
  /** Razón del bloqueo */
  reason?: string;
  /** Tipo de bloqueo */
  type: BlockingType;
  /** Si es un override con horarios personalizados */
  hasCustomSchedule: boolean;
  /** Horarios personalizados si los tiene */
  customSchedule?: {
    startTime?: string;
    endTime?: string;
    slotDuration?: number;
  };
  /** Nota adicional */
  note?: string;
  /** ID interno para manejo en el frontend */
  id: string;
  /** Fecha de creación */
  createdAt?: Date;
}

/**
 * Extensión del DayOverrideDto con propiedades adicionales para UI
 */
export interface DayOverride extends DayOverrideDto {
  /** ID único para manejo en frontend */
  id?: string;
  /** Si tiene horarios personalizados (no solo bloqueo) */
  isCustomSchedule: boolean;
  /** Fecha de creación */
  createdAt?: Date;
  /** Si está activo actualmente */
  isActive: boolean;
}

/**
 * Configuración para bloqueo múltiple de fechas
 */
export interface BulkBlockingConfig {
  /** Fechas a bloquear */
  dates: string[];
  /** Razón del bloqueo */
  reason?: string;
  /** Tipo de bloqueo */
  type: BlockingType;
  /** Si debe aplicar horarios personalizados */
  applyCustomSchedule?: boolean;
  /** Configuración de horarios personalizados */
  customSchedule?: {
    startTime: string;
    endTime: string;
    slotDuration?: number;
  };
}

/**
 * Información de disponibilidad de un día específico
 */
export interface DayAvailability {
  /** Fecha */
  date: string;
  /** Estado de disponibilidad */
  status: AvailabilityStatus;
  /** Horario de trabajo para ese día */
  workingHours?: {
    startTime: string;
    endTime: string;
    slotDuration: number;
  };
  /** Número de slots disponibles */
  availableSlots?: number;
  /** Número total de slots */
  totalSlots?: number;
  /** Información adicional */
  info?: string;
  /** Si tiene configuraciones especiales */
  hasOverrides: boolean;
}

/**
 * Datos del calendario mensual
 */
export interface MonthlyCalendarData {
  /** Año */
  year: number;
  /** Mes (1-12) */
  month: number;
  /** Disponibilidad de cada día del mes */
  days: Record<string, DayAvailability>;
  /** Días bloqueados */
  blockedDates: string[];
  /** Días con configuraciones especiales */
  overrideDates: string[];
  /** Días festivos */
  holidays: string[];
}

/**
 * Filtros para búsqueda de fechas bloqueadas
 */
export interface BlockingFilters {
  /** Fecha desde */
  fromDate?: string;
  /** Fecha hasta */
  toDate?: string;
  /** Tipo de bloqueo */
  type?: BlockingType;
  /** Solo fechas futuras */
  futureOnly?: boolean;
  /** Incluir días festivos */
  includeHolidays?: boolean;
}

/**
 * Request para crear un bloqueo de fechas
 */
export interface CreateBlockingRequest {
  /** Fechas a bloquear */
  dates: string[];
  /** Razón del bloqueo */
  reason?: string;
  /** ID del profesional (opcional para admin) */
  professionalId?: number;
}

/**
 * Request para desbloquear fechas
 */
export interface UnblockDatesRequest {
  /** Fechas a desbloquear */
  dates: string[];
  /** ID del profesional (opcional para admin) */
  professionalId?: number;
}

/**
 * Response de operaciones de bloqueo
 */
export interface BlockingOperationResult {
  /** Si la operación fue exitosa */
  success: boolean;
  /** Mensaje de resultado */
  message?: string;
  /** Fechas procesadas exitosamente */
  processedDates?: string[];
  /** Fechas que fallaron */
  failedDates?: string[];
  /** Errores específicos */
  errors?: string[];
}

/**
 * Configuración de plantilla de bloqueo
 */
export interface BlockingTemplate {
  /** ID de la plantilla */
  id: string;
  /** Nombre de la plantilla */
  name: string;
  /** Descripción */
  description?: string;
  /** Configuración de fechas */
  config: BulkBlockingConfig;
  /** Si es una plantilla del sistema */
  isSystem: boolean;
  /** Si está activa */
  isActive: boolean;
}

/**
 * Estado de carga para las operaciones
 */
export interface LoadingStates {
  /** Cargando fechas bloqueadas */
  loadingBlockedDates: boolean;
  /** Cargando overrides */
  loadingOverrides: boolean;
  /** Cargando disponibilidad del calendario */
  loadingCalendar: boolean;
  /** Procesando bloqueo de fechas */
  blocking: boolean;
  /** Procesando desbloqueo */
  unblocking: boolean;
  /** Creando override */
  creatingOverride: boolean;
}

/**
 * Utilidades para manejo de fechas
 */
export class DateBlockingUtils {
  /**
   * Generar ID único para una fecha bloqueada
   */
  static generateBlockedDateId(date: string, type: BlockingType): string {
    return `${date}-${type}-${Date.now()}`;
  }

  /**
   * Verificar si una fecha está en el pasado
   */
  static isPastDate(date: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date + 'T00:00:00');
    return targetDate < today;
  }

  /**
   * Formatear fecha para display
   */
  static formatDateForDisplay(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Obtener el nombre del día de la semana
   */
  static getDayName(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long'
    });
  }

  /**
   * Verificar si dos rangos de fechas se superponen
   */
  static dateRangesOverlap(
    start1: string, end1: string,
    start2: string, end2: string
  ): boolean {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    
    return s1 <= e2 && s2 <= e1;
  }

  /**
   * Convertir Date a string formato YYYY-MM-DD
   */
  static formatDateToString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Convertir string YYYY-MM-DD a Date
   */
  static parseStringToDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
  }

  /**
   * Generar array de fechas entre dos fechas
   */
  static generateDateRange(startDate: string, endDate: string): string[] {
    const start = this.parseStringToDate(startDate);
    const end = this.parseStringToDate(endDate);
    const dates: string[] = [];
    
    const current = new Date(start);
    while (current <= end) {
      dates.push(this.formatDateToString(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }
}